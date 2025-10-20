const axios = require('axios');

class MultiStopRoutingService {
    constructor() {
        this.lastRequestTime = 0;
        this.minRequestInterval = 1100; // 1.1 seconds between requests because of rate limiting
    }

    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    async getDistanceMatrix(stops) {
        try {
            await this.waitForRateLimit();
            
            const coordinates = stops.map(stop => `${stop.lng},${stop.lat}`).join(';');
            const url = `http://router.project-osrm.org/table/v1/driving/${coordinates}?annotations=distance`;
            
            const response = await axios.get(url, {
                timeout: 30000,
                headers: { 'User-Agent': 'GPS-Shortest-Path-App/1.0' }
            });
            
            if (response.data && response.data.distances) {
                return response.data.distances.map(row => 
                    row.map(dist => dist / 1000)
                );
            }
            
            throw new Error('Invalid response from OSRM Table API');
        } catch (error) {
            if (error.response && error.response.status === 429) {
                throw new Error('OSRM service is temporarily unavailable due to rate limiting. Please wait a few minutes and try again.');
            }
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                throw new Error('Route calculation timed out. OSRM service is busy or your IP is rate limited. Please wait a few minutes and try again.');
            }
            if (error.code === 'ECONNRESET') {
                throw new Error('Connection to routing service was reset. You may still be rate limited. Please wait a few minutes and try again.');
            }
            throw new Error(`Failed to calculate route: ${error.message}`);
        }
    }

    twoOpt(routeIndices, distanceMatrix) {
        let bestRoute = [...routeIndices];
        let improvement = true;

        while (improvement) {
            improvement = false;
            for (let i = 1; i < bestRoute.length - 2; i++) {
                for (let k = i + 1; k < bestRoute.length - 1; k++) {
                    const p1 = bestRoute[i - 1];
                    const p2 = bestRoute[i];
                    const p3 = bestRoute[k];
                    const p4 = bestRoute[k + 1];

                    const currentDistance = distanceMatrix[p1][p2] + distanceMatrix[p3][p4];
                    const newDistance = distanceMatrix[p1][p3] + distanceMatrix[p2][p4];

                    if (newDistance < currentDistance) {
                        const newRoute = bestRoute.slice(0, i)
                            .concat(bestRoute.slice(i, k + 1).reverse())
                            .concat(bestRoute.slice(k + 1));
                        
                        bestRoute = newRoute;
                        improvement = true;
                    }
                }
            }
        }
        return bestRoute;
    }
    // calculating by using greedy + 2-opt algorithm
    async createRouteFromStops(stops) {
        if (!stops || stops.length < 2) {
            throw new Error('At least 2 stops are required');
        }

        const distanceMatrix = await this.getDistanceMatrix(stops);

        // helper: compute route length (sum of consecutive distances)
        const routeLength = (route) => {
            let sum = 0;
            for (let i = 0; i < route.length - 1; i++) {
                sum += distanceMatrix[route[i]][route[i+1]];
            }
            return sum;
        };

        // nearest neighbor starting from a given start index
        const nearestNeighbor = (startIndex) => {
            const route = [startIndex];
            const visited = new Set([startIndex]);
            let current = startIndex;

            while (visited.size < stops.length) {
                let next = -1;
                let bestDist = Infinity;
                for (let j = 0; j < stops.length; j++) {
                    if (visited.has(j)) continue;
                    const d = distanceMatrix[current][j];
                    if (d < bestDist) {
                        bestDist = d;
                        next = j;
                    }
                }
                if (next === -1) break;
                route.push(next);
                visited.add(next);
                current = next;
            }
            return route;
        };

        // farthest insertion heuristic to get a good initial tour
        const farthestInsertion = (startIndex) => {
            // start with startIndex and nearest neighbor to it
            const inTour = new Set([startIndex]);
            const tour = [startIndex];

            // add nearest neighbor to start to have at least two nodes
            let nearest = -1;
            let nd = Infinity;
            for (let j = 0; j < stops.length; j++) {
                if (j === startIndex) continue;
                if (distanceMatrix[startIndex][j] < nd) {
                    nd = distanceMatrix[startIndex][j];
                    nearest = j;
                }
            }
            if (nearest === -1) return tour;
            tour.push(nearest);
            inTour.add(nearest);

            while (inTour.size < stops.length) {
                // find farthest point from current tour (by min distance to any tour node)
                let farthest = -1;
                let farthestDist = -Infinity;
                for (let j = 0; j < stops.length; j++) {
                    if (inTour.has(j)) continue;
                    let minDistToTour = Infinity;
                    for (const t of tour) {
                        if (distanceMatrix[j][t] < minDistToTour) minDistToTour = distanceMatrix[j][t];
                    }
                    if (minDistToTour > farthestDist) {
                        farthestDist = minDistToTour;
                        farthest = j;
                    }
                }

                // find best place to insert farthest into tour (min increase)
                let bestPos = 0;
                let bestIncrease = Infinity;
                for (let i = 0; i < tour.length; i++) {
                    const a = tour[i];
                    const b = tour[(i+1) % tour.length];
                    const increase = distanceMatrix[a][farthest] + distanceMatrix[farthest][b] - distanceMatrix[a][b];
                    if (increase < bestIncrease) {
                        bestIncrease = increase;
                        bestPos = i + 1;
                    }
                }
                tour.splice(bestPos, 0, farthest);
                inTour.add(farthest);
            }

            return tour;
        };

        // Multi-start: try several starts (warehouse likely at index 0 if provided)
        const starts = [];
        // prefer start at index 0 (warehouse) if present
        for (let i = 0; i < Math.min(stops.length, 6); i++) starts.push(i);

        let bestRoute = null;
        let bestLen = Infinity;

        for (const s of starts) {
            // try nearest neighbor
            let candidate = nearestNeighbor(s);
            candidate = this.twoOpt(candidate, distanceMatrix);
            let len = routeLength(candidate);
            if (len < bestLen) { bestLen = len; bestRoute = candidate; }

            // try farthest insertion
            candidate = farthestInsertion(s);
            candidate = this.twoOpt(candidate, distanceMatrix);
            len = routeLength(candidate);
            if (len < bestLen) { bestLen = len; bestRoute = candidate; }
        }

        // As fallback, if bestRoute doesn't cover all nodes (edge cases), fill missing
        if (!bestRoute || bestRoute.length !== stops.length) {
            const filled = [];
            const present = new Set(bestRoute || []);
            if (bestRoute) filled.push(...bestRoute);
            for (let i = 0; i < stops.length; i++) {
                if (!present.has(i)) filled.push(i);
            }
            bestRoute = this.twoOpt(filled, distanceMatrix);
        }

        const optimizedRouteIndices = bestRoute;

        const finalRoute = optimizedRouteIndices.map(index => stops[index]);
        const finalDistances = [];
        for (let i = 0; i < optimizedRouteIndices.length - 1; i++) {
            const fromIndex = optimizedRouteIndices[i];
            const toIndex = optimizedRouteIndices[i + 1];
            finalDistances.push(distanceMatrix[fromIndex][toIndex]);
        }
        const totalDistance = finalDistances.reduce((sum, dist) => sum + dist, 0);

        return {
            route: finalRoute,
            distances: finalDistances,
            totalDistance: totalDistance
        };
    }
}

module.exports = {
    MultiStopRoutingService
};
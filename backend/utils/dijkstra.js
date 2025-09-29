
function dijkstra(graph, startNode, endNode) {
    try {
        const dist = {};
        const prev = {};
        const unvisited = new Set();

        if (!graph || !graph.nodes || !graph.edges) {
            throw new Error('Invalid graph structure');
        }
        if (!startNode || !endNode) {
            throw new Error('Invalid start or end node');
        }

        graph.nodes.forEach(node => {
            const key = `${node.lat.toFixed(5)},${node.lng.toFixed(5)}`;
            dist[key] = Infinity;
            prev[key] = null;
            unvisited.add(key);
        });

        const startKey = `${startNode.lat.toFixed(5)},${startNode.lng.toFixed(5)}`; // Precision düşürüldü
        const endKey = `${endNode.lat.toFixed(5)},${endNode.lng.toFixed(5)}`; // Precision düşürüldü
        dist[startKey] = 0;

        console.log(`Dijkstra başladı: ${startKey} -> ${endKey}`);
        console.log(`Toplam node sayısı: ${graph.nodes.length}, Edge sayısı: ${Object.keys(graph.edges).length}`);

        while(unvisited.size > 0) {
            let closestKey = null;
            let minDist = Infinity;
        
        unvisited.forEach(key => {
            if(dist[key] < minDist) {
                minDist = dist[key];
                closestKey = key;
            }
        });
    
        if(minDist === Infinity) {
            console.log('Dijkstra: Ulaşılabilir node kalmadı');
            break;
        }
        if(closestKey === endKey) {
            console.log('Dijkstra: Hedefe ulaşıldı');
            break;
        }

        const closestNode = graph.nodes.find(node => 
            `${node.lat.toFixed(5)},${node.lng.toFixed(5)}` === closestKey // Precision düşürüldü
        );

        if(graph.edges[closestKey]) {
            graph.edges[closestKey].forEach(neighbor => {
                const neighborKey = `${neighbor.to.lat.toFixed(5)},${neighbor.to.lng.toFixed(5)}`; // Precision düşürüldü
                const newDist = dist[closestKey] + neighbor.weight;
                if(newDist < dist[neighborKey]) {
                    dist[neighborKey] = newDist;
                    prev[neighborKey] = closestKey;
                }
            });
        }
        
        unvisited.delete(closestKey);
    }

    const path = [];
    let currentKey = endKey;
    while(currentKey) {
        const node = graph.nodes.find(n => `${n.lat.toFixed(5)},${n.lng.toFixed(5)}` === currentKey); // Precision düşürüldü
        if(node) path.push(node);
        currentKey = prev[currentKey];
    }

    console.log(`Dijkstra tamamlandı: ${path.length} node path`);
    
    return {
        distance: dist[endKey] || Infinity, 
        path: path.reverse()
    };
    
    } catch (error) {
        console.error('Dijkstra hatası:', error.message);
        console.error('Error stack:', error.stack);
        return {
            distance: Infinity,
            path: []
        };
    }
}

module.exports = { dijkstra };
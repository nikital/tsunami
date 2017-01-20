type Point = createjs.Point;
let Point = createjs.Point;

class Main extends createjs.Stage {
    graphRenderer: GraphRenderer;

    constructor () {
        super ('main-canvas');

        this.graphRenderer = new GraphRenderer ();
        this.addChild (this.graphRenderer);

        let graph = new Graph ();
        graph.nodes = [new Point (10, 10), new Point (100, 100)];
        graph.edges = [new Edge (graph.nodes[0], graph.nodes[1])];
        this.graphRenderer.render (graph);
    }

    update () {
        super.update ();
        requestAnimationFrame (this.update.bind (this));
    }
}

class Edge {
    constructor (public node1: Point, public node2: Point) {}
}

class Graph {
    nodes: Point[];
    edges: Edge[];
}

class GraphRenderer extends createjs.Shape {
    render (graph: Graph) {
        let g = this.graphics;
        g.clear ();
        g.beginFill ('black');
        for (let node of graph.nodes) {
            g.drawCircle (node.x, node.y, 5);
        }
        g.beginStroke ('black');
        for (let edge of graph.edges) {
            g.moveTo (edge.node1.x, edge.node1.y);
            g.lineTo (edge.node2.x, edge.node2.y);
        }
    }
}

let main = new Main ();
main.update ();

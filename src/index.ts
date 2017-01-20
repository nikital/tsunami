type Point = createjs.Point;
let Point = createjs.Point;

class Main extends createjs.Stage {
    graphRenderer: GraphRenderer;

    constructor (g: Graph) {
        super ('main-canvas');

        this.graphRenderer = new GraphRenderer ();
        this.addChild (this.graphRenderer);

        this.graphRenderer.render (g);
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

let ex_graph = new Graph ();
ex_graph.nodes = [new Point (935/2,100/2),
                  new Point (1370/2,105/2),
                  new Point (1188/2,392/2),
                  new Point (934/2,400/2),
                  new Point (1197/2,645/2),
                  new Point (1587/2,954/2),
                  new Point (663/2,542/2),
                  new Point (664/2,802/2),
                  new Point (892/2,688/2),
                  new Point (405/2,962/2),
                  new Point (908/2,933/2),
                  new Point (1166/2,970/2)];
ex_graph.edges = [new Edge (ex_graph.nodes[1], ex_graph.nodes[0]),
                  new Edge (ex_graph.nodes[1], ex_graph.nodes[2]),
                  new Edge (ex_graph.nodes[0], ex_graph.nodes[3]),
                  new Edge (ex_graph.nodes[2], ex_graph.nodes[3]),
                  new Edge (ex_graph.nodes[5], ex_graph.nodes[4]),
                  new Edge (ex_graph.nodes[4], ex_graph.nodes[2]),
                  new Edge (ex_graph.nodes[3], ex_graph.nodes[6]),
                  new Edge (ex_graph.nodes[6], ex_graph.nodes[7]),
                  new Edge (ex_graph.nodes[8], ex_graph.nodes[4]),
                  new Edge (ex_graph.nodes[8], ex_graph.nodes[7]),
                  new Edge (ex_graph.nodes[7], ex_graph.nodes[9]),
                  new Edge (ex_graph.nodes[7], ex_graph.nodes[10]),
                  new Edge (ex_graph.nodes[8], ex_graph.nodes[10]),
                  new Edge (ex_graph.nodes[10],ex_graph.nodes[11])];

class GraphRenderer extends createjs.Shape {
    render (graph: Graph) {
        let g = this.graphics;
        g.clear ();
        for (let node of graph.nodes) {
            g.beginFill ('black');
            console.log (node);
            g.drawCircle (node.x, node.y, 5);
            g.endFill ()
        }
        for (let edge of graph.edges) {
            g.beginStroke ('black');
            g.moveTo (edge.node1.x, edge.node1.y);
            g.lineTo (edge.node2.x, edge.node2.y);
            g.endStroke ();
        }
    }
}

let main = new Main (ex_graph);
main.update ();

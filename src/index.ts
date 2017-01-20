type Point = createjs.Point;
let Point = createjs.Point;

class Intersection{
    public roads: Road[];
    location: Point;
    constructor(x: number, y: number){
        this.roads = [];
        this.location = new Point(x,y);
    }
}

class Road {
    constructor (public intersection1: Intersection, public intersection2: Intersection) {
        intersection1.roads.push(this);
        intersection2.roads.push(this);
    }
}

class City{
    public intersections: Intersection[];
}

class Map {
    public roads: Road[] = [];
    public cities: City[] = [];
}

class Main extends createjs.Stage {
    graphRenderer: MapRenderer;

    constructor (map: Map) {
        super ('main-canvas');

        this.graphRenderer = new MapRenderer ();
        this.addChild (this.graphRenderer);

        this.graphRenderer.render (map);
    }

    update () {
        super.update ();
        requestAnimationFrame (this.update.bind (this));
    }
}

class MapRenderer extends createjs.Shape {
    render (map: Map) {
        let g = this.graphics;
        g.clear ();
        for (let city of map.cities) {
            g.beginFill ('black');
            g.drawCircle (city.intersections[0].location.x, city.intersections[0].location.y, 5);
            g.endFill ();
        }
        for (let road of map.roads) {
            g.beginStroke ('black');
            g.moveTo (road.intersection1.location.x, road.intersection1.location.y);
            g.lineTo (road.intersection2.location.x, road.intersection2.location.y);
            g.endStroke ();
        }
    }
}

let ex_graph = new Map ();
let intersections = [new Intersection (935/2,100/2),
                  new Intersection (1370/2,105/2),
                  new Intersection (1188/2,392/2),
                  new Intersection (934/2,400/2),
                  new Intersection (1197/2,645/2),
                  new Intersection (1587/2,954/2),
                  new Intersection (663/2,542/2),
                  new Intersection (664/2,802/2),
                  new Intersection (892/2,688/2),
                  new Intersection (405/2,962/2),
                  new Intersection (908/2,933/2),
                  new Intersection (1166/2,970/2)];
ex_graph.roads = [new Road (intersections[1], intersections[0]),
                  new Road (intersections[1], intersections[2]),
                  new Road (intersections[0], intersections[3]),
                  new Road (intersections[2], intersections[3]),
                  new Road (intersections[5], intersections[4]),
                  new Road (intersections[4], intersections[2]),
                  new Road (intersections[3], intersections[6]),
                  new Road (intersections[6], intersections[7]),
                  new Road (intersections[8], intersections[4]),
                  new Road (intersections[8], intersections[7]),
                  new Road (intersections[7], intersections[9]),
                  new Road (intersections[7], intersections[10]),
                  new Road (intersections[8], intersections[10]),
                  new Road (intersections[10],intersections[11])];

let main = new Main (ex_graph);
main.update ();

type Point = createjs.Point;
let Point = createjs.Point;

let g_speed = 1;

function distance(p1: Intersection, p2: Intersection): number{
    let dx = p1.location.x - p2.location.x;
    let dy = p1.location.y - p2.location.y;
    return Math.sqrt(dx*dx + dy*dy);
}

class Intersection{
    public roads: Road[];
    location: Point;

    constructor(x: number, y: number){
        this.roads = [];
        this.location = new Point(x,y);
    }
}

class Road {
    public carCount: number;
    public carCapacity: number;
    public enabled: boolean;
    public distance: number;

    constructor (public start: Intersection, public end: Intersection) {
        start.roads.push(this);
        this.distance = distance(this.start, this.end);
        this.enabled = true;
    }

    public baseTravelTime(): number{
        return this.distance/g_speed;
    }

    public travelTime(): number{
        let current_speed = g_speed;
        if (this.carCount > this.carCapacity){
            current_speed *= this.carCapacity/this.carCount; 
        }
        return this.distance / current_speed;
    }

    public mergeTime(): number{
        if (this.carCapacity > this.carCount){
            return 0;
        }
        return (this.carCount / this.carCapacity) * this.baseTravelTime();
    }
}

class City{
    public intersections: Intersection[];
    constructor (intersection: Intersection) {
        this.intersections = [intersection];
    }
}

class Map {
    public roads: Road[] = [];
    public cities: City[] = [];
}

enum CarState{
    Traveling,
    Merging
}

class Car{
    timer: number;
    state: CarState;
    nextRoad: Road;

    constructor(public currentRoad: Road, public destination: City){
        this.timer = this.currentRoad.travelTime();
        this.currentRoad.carCount++;
        this.state = CarState.Traveling;
    }

    public update(){
        this.timer--;
        if(this.timer > 0){
            return;
        }

        switch(this.state){
            case CarState.Traveling:
                this.timer = this.nextRoad.mergeTime();
                this.state = CarState.Merging;
                break;
            case CarState.Merging:
                this.currentRoad.carCount--;
                this.currentRoad = this.nextRoad;
                this.currentRoad.carCount++;
                this.timer = this.currentRoad.travelTime();
                break;
        }
    }

    private getNextRoad(){
        this.nextRoad = this.currentRoad.end.roads[0];
    }
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
            g.drawCircle (city.intersections[0].location.x, city.intersections[0].location.y, 10);
            g.endFill ();
        }
        for (let road of map.roads) {
            g.beginStroke ('black');
            g.moveTo (road.start.location.x, road.start.location.y);
            g.lineTo (road.end.location.x, road.end.location.y);
            g.endStroke ();
        }
    }
}

let map = new Map ();
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
map.roads = [new Road (intersections[1], intersections[0]),
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
map.cities = [new City (intersections[9]),
              new City (intersections[1])];

function makeRoadsDoublyLinked (m: Map) {
    let newRoads: Road[] = []
    for (let road of m.roads) {
        newRoads.push (new Road (road.end, road.start));
    }
    m.roads = m.roads.concat (newRoads);
}
makeRoadsDoublyLinked (map);

let main = new Main (map);
main.update ();

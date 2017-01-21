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
        this.carCount = 0;
        this.carCapacity = this.distance;
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
    public evacuate: City;

    constructor (intersections: Intersection[], public isHitByTsunami: boolean) {
        this.intersections = intersections;
    }

    public GiveBirthToACar(){
        //TODO: should the destination city be randomly selected? 
        let possibleDestinations = map.cities.filter(city => city != this && city.isHitByTsunami == false);
        let destinationIndex = Math.floor(Math.random() * possibleDestinations.length);
        let intersectionIndex = Math.floor(Math.random() * this.intersections.length);
        map.cars.push(new Car(this.intersections[intersectionIndex].roads[0], possibleDestinations[destinationIndex]));
    }

    //public GiveBirthToACar(destination: City){
    //    map.cars.push(new Car(this.intersections[0].roads[0], destination));
    //} 
}

class Map {
    public cars: Car[] =[];
    public roads: Road[] = [];
    public cities: City[] = [];
}

enum CarState{
    Traveling,
    Merging,
    Done
}

class AStarIntersection{
    gScore: number;
    fScore: number;

    constructor(public intersection:Intersection, public sourceIntersection: AStarIntersection, hScore: number ){
        if(this.sourceIntersection == null){
            this.gScore = 0;
        }
        else{
        this.gScore = distance(this.intersection, this.sourceIntersection.intersection) + this.sourceIntersection.gScore;
        }
        this.fScore = this.gScore + hScore;
    }
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
        console.log("time: " , this.timer , "state: " , this.state , " current road: " , this.currentRoad);
        if(this.timer > 0){
            return;
        }

        switch(this.state){
            case CarState.Traveling:
                if (this.currentRoad.end == this.destination.intersections[0])
                {
                    console.log("Car is done!");
                    this.state = CarState.Done;
                    map.cars.splice(map.cars.indexOf(this), 1);
                    this.currentRoad.carCount--;
                    return;
                }
                this.getNextRoad();
                this.timer = this.nextRoad.mergeTime();
                this.state = CarState.Merging;
                break;
            case CarState.Merging:
                this.currentRoad.carCount--;
                this.currentRoad = this.nextRoad;
                this.currentRoad.carCount++;
                this.timer = this.currentRoad.travelTime();
                this.state = CarState.Traveling;
                break;
        }
    }

    private reconstructPath(aStarIntersection: AStarIntersection): Road{
        while(aStarIntersection.sourceIntersection.gScore != 0){
            aStarIntersection = aStarIntersection.sourceIntersection;
        }
        return this.currentRoad.end.roads.filter(road => road.end == aStarIntersection.intersection)[0];
    }

    private getNextRoad(){
        let closedSet = [];
        let openSet = [];
        let current = new AStarIntersection(this.currentRoad.end,  new AStarIntersection(this.currentRoad.end, null, 0), 9999999);
        openSet.push(current);
        while(openSet.length > 0)
        {
            openSet.sort(function(a: AStarIntersection, b: AStarIntersection){return a.fScore - b.fScore;}).reverse();
            let lowestFScoreIntersection : AStarIntersection = openSet.pop();
            if (lowestFScoreIntersection.intersection == this.destination.intersections[0]){
                this.nextRoad = this.reconstructPath(lowestFScoreIntersection);
                return;
            }
            closedSet.push(lowestFScoreIntersection);
            for (let road of lowestFScoreIntersection.intersection.roads.filter(road => road.enabled)){
                if (closedSet.map(intersection => intersection.intersection).indexOf(road.end) != -1){
                    continue;
                }
                let currentNeighborIntersection = new AStarIntersection(road.end, lowestFScoreIntersection, distance(road.end, this.destination.intersections[0]));
                let currentNeighborIntersectionIndex: number = openSet.map(intersection => intersection.intersection).indexOf(road.end);
                if(currentNeighborIntersectionIndex == -1){
                    openSet.push(currentNeighborIntersection);
                    continue;
                }

                if (currentNeighborIntersection.gScore  >= openSet[currentNeighborIntersectionIndex].gScore){
                    continue;
                }
                openSet[currentNeighborIntersectionIndex] = currentNeighborIntersection;
            }
        }
    }
}

class Main extends createjs.Stage {
    renderer: MapRenderer;
    carTimer: number;

    constructor (map: Map) {
        super ('main-canvas');
        this.enableMouseOver ();
        this.carTimer = 1;
        this.renderer = new MapRenderer (map);
        this.addChild (this.renderer);
    
}

    update () {
        super.update ();
        this.spawnCar ();
        this.updateCars ();
        requestAnimationFrame (this.update.bind (this));
    }

    private spawnCar(){
        this.carTimer--;
        if(this.carTimer > 0){
            return;
        }
        let hazardousCities = map.cities.filter(city => city.isHitByTsunami);     
        hazardousCities[Math.floor(Math.random() * hazardousCities.length)].GiveBirthToACar();
        this.carTimer = 100;
    }

    private updateCars(){
        for(let car of map.cars){
            car.update();
        }
    }
}

class Container<T> extends createjs.Container {
    constructor (public child: createjs.DisplayObject, public data: T) {
        super ();
        this.addChild (child);
    }
}

class MapRenderer extends createjs.Container {
    constructor (private map: Map) {
        super ();
        for (let road of map.roads) {
            let roadShape = new createjs.Shape ();
            roadShape.cursor = 'pointer';
            this.render_road (road, roadShape.graphics);

            let container = new Container (roadShape, road);
            this.addChild (container);
            container.on ('click', this.on_road.bind (this));
        }
        for (let city of map.cities) {
            let cityShape = new createjs.Shape ();
            cityShape.cursor = 'pointer';
            let g = cityShape.graphics;
            g.beginFill ('black');
            g.drawCircle (city.intersections[0].location.x, city.intersections[0].location.y, 20);
            g.endFill ();

            let container = new Container (cityShape, city);
            this.addChild (container);

        }
    }
    on_road (e:createjs.MouseEvent) {
        let road: Road = e.currentTarget.data;
        let roadShape: createjs.Shape = e.currentTarget.child;
        road.enabled = !road.enabled;
        this.render_road (road, roadShape.graphics);
    }

    render_road (road: Road, g: createjs.Graphics) {
        let width = 10;

        let dx = road.end.location.x - road.start.location.x;
        let dy = road.end.location.y - road.start.location.y;
        let orthox = -dy/road.distance * width;
        let orthoy = dx/road.distance * width;

        g.clear ();
        g.setStrokeStyle (width * 2+1, 'round');
        g.beginStroke (road.enabled ? '#aaaaaa' : 'red');
        g.moveTo (road.start.location.x + orthox, road.start.location.y + orthoy);
        g.lineTo (road.end.location.x + orthox, road.end.location.y + orthoy);
        g.endStroke ();
        g.setStrokeStyle (1);
        g.beginStroke ('black');
        g.moveTo (road.start.location.x + orthox, road.start.location.y + orthoy);
        g.lineTo (road.end.location.x + orthox, road.end.location.y + orthoy);
        g.endStroke ();
    }
}

let map = new Map ();
let intersections = [new Intersection (935*3/4,100*3/4),
                     new Intersection (1370*3/4,105*3/4),
                     new Intersection (1188*3/4,392*3/4),
                     new Intersection (934*3/4,400*3/4),
                     new Intersection (1197*3/4,645*3/4),
                     new Intersection (1587*3/4,954*3/4),
                     new Intersection (663*3/4,542*3/4),
                     new Intersection (664*3/4,802*3/4),
                     new Intersection (892*3/4,688*3/4),
                     new Intersection (405*3/4,962*3/4),
                     new Intersection (908*3/4,933*3/4),
                     new Intersection (1166*3/4,970*3/4)];
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
map.cities = [new City ([intersections[9]], true),
              new City ([intersections[1]], false)];

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

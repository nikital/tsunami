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
    public waitingCars: Car[];

    constructor (public start: Intersection, public end: Intersection) {
        start.roads.push(this);
        this.distance = distance(this.start, this.end);
        this.enabled = true;
        this.carCount = 0;
        this.carCapacity = this.distance;
        this.waitingCars = [];
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

    public addWaitingCar(car: Car){
        this.waitingCars.push(car);
    }

    public removeWaitingCar(car: Car){
        this.waitingCars.splice(this.waitingCars.indexOf(car),1);
    }

    public isNextInLine( car: Car): boolean{
        return this.waitingCars.indexOf(car) == 0;
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
    Waiting,
    Merging,
    Done
}

class AStarIntersection{
    gScore: number;
    fScore: number;

    constructor(public intersection:Intersection, public sourceIntersection: AStarIntersection, hScore: number, gScoreAdder: number ){
        if(this.sourceIntersection == null){
            this.gScore = 0;
        }
        else{
        this.gScore = distance(this.intersection, this.sourceIntersection.intersection) + this.sourceIntersection.gScore + gScoreAdder;
        }
        this.fScore = this.gScore + hScore;
    }
}

class Car{
    timer: number;
    timerStartValue: number;
    state: CarState;
    nextRoad: Road;
    knownBlockedRoads: Road[];

    constructor(public currentRoad: Road, public destination: City){
        this.timerStartValue = this.timer = this.currentRoad.travelTime();
        this.currentRoad.carCount++;
        this.state = CarState.Traveling;
        this.knownBlockedRoads = []
    }

    public update(){
        this.timer--;
        if(this.timer > 0){
            return;
        }

        switch(this.state){
            case CarState.Waiting:
            case CarState.Traveling:
                if(this.destination.intersections.indexOf(this.currentRoad.end) != -1)
                {
                    console.log("Car is done!");
                    this.state = CarState.Done;
                    map.cars.splice(map.cars.indexOf(this), 1);
                    this.currentRoad.carCount--;
                    return;
                }
                this.deciveWhatsNext();
                break;
            case CarState.Merging:
                if(!this.nextRoad.isNextInLine(this))
                {
                    this.deciveWhatsNext();
                    break;
                }
                this.currentRoad.carCount--;
                this.currentRoad = this.nextRoad;
                this.currentRoad.carCount++;
                this.currentRoad.removeWaitingCar(this);
                this.timerStartValue = this.timer = this.currentRoad.travelTime();
                this.state = CarState.Traveling;
                break;
        }
    }

    private deciveWhatsNext(){
        this.getNextRoad();
        if(this.nextRoad == null)
        {
            this.timer = 10;
            this.state = CarState.Waiting;
            return;
        }

        this.nextRoad.addWaitingCar(this);
        this.timerStartValue = this.timer = 5
        this.state = CarState.Merging;
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
        let current = new AStarIntersection(this.currentRoad.end,  new AStarIntersection(this.currentRoad.end, null, 0, 0), 9999999, 0);
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
            for (let road of lowestFScoreIntersection.intersection.roads){
                if (closedSet.map(intersection => intersection.intersection).indexOf(road.end) != -1){
                    continue;
                }

                let gScoreAdder = 0;
                if(lowestFScoreIntersection == current){
                    if(!road.enabled)
                    {
                        if(this.knownBlockedRoads.indexOf(road) == -1){
                            this.knownBlockedRoads.push(road);
                        }
                        continue;
                    }
                    if(this.knownBlockedRoads.indexOf(road) != -1){
                        this.knownBlockedRoads.splice(this.knownBlockedRoads.indexOf(road),1)
                    }
                    gScoreAdder =  (road.carCount + road.waitingCars.length) ;
                }
                else{
                    if(this.knownBlockedRoads.indexOf(road) != -1){
                        gScoreAdder = road.distance * 1000;
                    }
                }

                let currentNeighborIntersection = new AStarIntersection(road.end, lowestFScoreIntersection, distance(road.end, this.destination.intersections[0]), gScoreAdder);
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
        this.nextRoad = null;
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
        this.spawnCar ();
        this.updateCars ();
        this.renderer.update ();
        super.update ();
        setTimeout (this.update.bind (this), 1000/30);
    }

    private spawnCar(){
        this.carTimer--;
        if(this.carTimer > 0){
            return;
        }
        let hazardousCities = map.cities.filter(city => city.isHitByTsunami);     
        hazardousCities[Math.floor(Math.random() * hazardousCities.length)].GiveBirthToACar();
        this.carTimer = 10;
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
    private width: number = 10;
    private cars = new createjs.Shape ();
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
        this.addChild (this.cars);
        for (let city of map.cities) {
            let cityShape = new createjs.Shape ();
            cityShape.cursor = 'pointer';
            let g = cityShape.graphics;
            g.beginFill ('black');
            g.drawCircle (city.intersections[0].location.x, city.intersections[0].location.y, this.width * 2);
            g.endFill ();

            let container = new Container (cityShape, city);
            this.addChild (container);

        }
    }
    update () {
        let g = this.cars.graphics;
        g.clear ();
        for (let car of map.cars) {
            if (car.timerStartValue <= 0) continue;
            let progress = 1 - car.timer / car.timerStartValue;
            let ortho = this.ortho_offset_for_road (car.currentRoad, this.width);
            if (car.state == CarState.Traveling) {
                let dx = car.currentRoad.end.location.x - car.currentRoad.start.location.x;
                let dy = car.currentRoad.end.location.y - car.currentRoad.start.location.y;
                dx *= progress;
                dy *= progress;
                let carx = car.currentRoad.start.location.x + dx;
                let cary = car.currentRoad.start.location.y + dy;
                g.beginFill ('green');
                g.drawCircle (carx + ortho.x, cary + ortho.y, 5);
                g.endFill ();
            }
        }
    }
    on_road (e:createjs.MouseEvent) {
        let road: Road = e.currentTarget.data;
        let roadShape: createjs.Shape = e.currentTarget.child;
        road.enabled = !road.enabled;
        this.render_road (road, roadShape.graphics);
    }

    render_road (road: Road, g: createjs.Graphics) {
        let ortho = this.ortho_offset_for_road (road, this.width);

        g.clear ();
        g.setStrokeStyle (this.width * 2+1, 'round');
        g.beginStroke (road.enabled ? '#aaaaaa' : 'red');
        g.moveTo (road.start.location.x + ortho.x, road.start.location.y + ortho.y);
        g.lineTo (road.end.location.x + ortho.x, road.end.location.y + ortho.y);
        g.endStroke ();
        g.setStrokeStyle (1);
        g.beginStroke ('black');
        g.moveTo (road.start.location.x + ortho.x, road.start.location.y + ortho.y);
        g.lineTo (road.end.location.x + ortho.x, road.end.location.y + ortho.y);
        g.endStroke ();
    }

    ortho_offset_for_road (road:Road, offset:number):Point {
        let dx = road.end.location.x - road.start.location.x;
        let dy = road.end.location.y - road.start.location.y;
        let orthox = -dy/road.distance * offset;
        let orthoy = dx/road.distance * offset;
        return new Point (orthox, orthoy);
    }
}

let map = new Map ();
let intersections = [new Intersection (935*5/8,100*5/8),
                     new Intersection (1370*5/8,105*5/8),
                     new Intersection (1188*5/8,392*5/8),
                     new Intersection (934*5/8,400*5/8),
                     new Intersection (1197*5/8,645*5/8),
                     new Intersection (1587*5/8,954*5/8),
                     new Intersection (663*5/8,542*5/8),
                     new Intersection (664*5/8,802*5/8),
                     new Intersection (892*5/8,688*5/8),
                     new Intersection (405*5/8,962*5/8),
                     new Intersection (908*5/8,933*5/8),
                     new Intersection (1166*5/8,970*5/8)];
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
              new City ([intersections[5]], true),
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

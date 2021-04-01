//selection du canva et enregistrement de sa taille
var div3d = document.getElementById("div_3d");
var fen3d = document.getElementById("can_3d");

const largeur_fenetre = div3d.clientWidth;
const longueur_fenetre = div3d.clientHeight;

const x_offset = div3d.getBoundingClientRect().left;
const y_offset = div3d.getBoundingClientRect().top;
//

//mise en place de la scene et de la caméra
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0x101010 );
var camera = new THREE.PerspectiveCamera( 75, largeur_fenetre/longueur_fenetre, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( largeur_fenetre,longueur_fenetre);
//

//integration du rendu dans le doc html
fen3d.appendChild( renderer.domElement );
//

//geom et shaders
var planete_geom = new THREE.SphereGeometry( 1, 32, 32 );//sphere utilisé par toute les planetes

const loader = new THREE.TextureLoader();
var text_lune = loader.load( 'textures/2k_moon.jpg', function(){console.log("loaded")} , undefined , function(err){console.log(err)} );

var planete_shader = new THREE.MeshPhongMaterial( {
	map: text_lune,
} );
//

var grid = new THREE.PolarGridHelper();//helper
scene.add(grid);
var axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

//les lumieres	a remplacer eventuellement par des point light au niveau des étoiles
var light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 1, 1 );
scene.add( light );

var light = new THREE.AmbientLight( 0x222222 );
scene.add( light );
//


//controls
var controls = new OrbitControls( camera, renderer.domElement);
camera.position.set(0,0,10);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.update();
//

//Selectionner planete
fen3d.addEventListener("dblclick",raycast);
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var targ = new THREE.Vector3(0,0,0);

function raycast(){
	mouse.x = ((event.clientX - x_offset) / largeur_fenetre)*2 -1;
	mouse.y = -((event.clientY - y_offset) / longueur_fenetre)*2+1;
	console.log(mouse);
	raycaster.setFromCamera( mouse , camera);
	var intersect_objets = raycaster.intersectObjects( planetes_grp.children );
	console.log(intersect_objets);
	index = intersect_objets[0].object.name;
	listeAstre[index].focus();
};
//



//fonction simuler

var delta_t = 0.02;


var playing = false;

function play(){
	if (playing){
		playing = false;
	}
	else {
		playing = true;
	}
}


function simuler(){
	for (var astre of listeAstre) {//on calcule la prochaine position de chaque astre
		astre.calculPosition();
	};
	
	for (var astre of listeAstre) {//on l'applique
		astre.set_pos(astre.prochaine_position);
	}

};
//


//objet planete
var planetes_grp = new THREE.Group();
scene.add(planetes_grp);

var Systeme = function(nom, masse, position, vitesse, index) {
	this.masse = masse;
	this.nom = nom;
	this.position = position;//un vecteur3
	this.prochaine_position = new THREE.Vector3();

	this.index = index;

	this.objet3d = new THREE.Mesh(planete_geom,planete_shader);
	this.objet3d.position.copy(this.position);
	this.objet3d.name = this.index;
	planetes_grp.add(this.objet3d);

	this.vitesse = vitesse;//un vecteur3

	this.fleche_vitesse = new THREE.ArrowHelper(vitesse, new THREE.Vector3(0,0,0), 2,0x0000ff);
	this.objet3d.add(this.fleche_vitesse);

	this.fleche_acceleration = new THREE.ArrowHelper(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),2,0xff0000);
	this.objet3d.add(this.fleche_acceleration);


	
	this.set_pos = function(vecteur_pos){
		this.position.copy(vecteur_pos);
		this.objet3d.position.copy(vecteur_pos);

	};

	this.set_fleche_vitesse = function(vitesse){//met a jour le vecteur bleu
		var vitesse_norm = vitesse.clone();
		var long = vitesse.length();
		vitesse_norm.normalize();
		this.fleche_vitesse.setDirection(vitesse_norm);
		this.fleche_vitesse.setLength(long);
	};

	this.set_fleche_acceleration = function(acceleration){//met a jour le vecteur rouge
		var acceleration_norm = acceleration.clone();
		var long = acceleration.length();
		acceleration_norm.normalize();
		this.fleche_acceleration.setDirection(acceleration_norm);
		this.fleche_acceleration.setLength(long);
	};

	this.focus = function() { //met l'astre au centre de la vue, très utile. eventuellement on pourra faire un truc pour avoir la caméra qui suis un astre qui bouge
		controls.target.copy(this.position.clone());
		controls.update();
		//this.objet3d.add(camera);
		this.objet3d.add(grid);
		this.objet3d.add(axesHelper);
	};

	this.calculPosition = function() {
		var vecteur_somme_acceleration = new THREE.Vector3(0,0,0);//vecteur somme des accélérations
		for (var astre of listeAstre){//pour tout les astres
			if (astre.index != this.index){//différents de celui la
				var distance = this.position.distanceTo(astre.position);

				var vecteur_this_astre = astre.position.clone().sub(this.position);//vecteur this->astre

				vecteur_this_astre.normalize();//normalisé /!\ normalize normalize le vecteur, il ne renvoie pas un un vecteur normalizé, c'est chiant je sais

				var acceleration = (6.673E-11 * astre.masse) / (distance**2 );//calcul de l'accélération
				var vecteur_acceleration = vecteur_this_astre.multiplyScalar(acceleration);//vecteur dirigé vers astre de norme accélération
				vecteur_somme_acceleration.add(vecteur_acceleration);//on ajoute ce vecteur a la somme des vecteurs
			};
		};

		this.vitesse.add(vecteur_somme_acceleration.clone().multiplyScalar(delta_t));//on ajoute la somme des accélérations à la vitesse
		this.set_fleche_acceleration(vecteur_somme_acceleration);//affiche les vecteurs
		this.set_fleche_vitesse(vitesse);//si le vecteur bleu n'est pas visible, c'est qu'il est confondue avec le vecteur
		//this.prochaine_position = this.position.clone();
		this.prochaine_position.addVectors(this.position ,this.vitesse.clone().multiplyScalar(delta_t));//manifestement ca ne marche pas

		console.log(this.nom);
		console.log("acceleration :",vecteur_somme_acceleration);
		console.log("vitesse :", this.vitesse);
		console.log("position :", this.prochaine_position);
	};
};	
//

var astre1 = new Systeme(
	nom = 'astre1',
	masse = 1E+11,
	position = new THREE.Vector3(3,0,0),
	vitesse = new THREE.Vector3(0,.7,0),
	index = 0
);	


var astre2 = new Systeme(
	nom = 'astre2',
	masse = 1E+11,
	position = new THREE.Vector3(-3,0,0),
	vitesse = new THREE.Vector3(0,-.7,0),
	index = 1
);


var astre3 = new Systeme(
	nom = 'astre3',
	masse = 1E+11,
	position = new THREE.Vector3(0,0,-9),
	vitesse = new THREE.Vector3(0,-.2,0),
	index = 2
);


var listeAstre = [astre1,astre2,astre3];

//function animation

function animate(){
	requestAnimationFrame(animate);

	if (playing){
		simuler();
	}
	controls.update();
	renderer.render(scene,camera);
};

animate();
//
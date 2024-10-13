import React, { useEffect, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import { PCA } from "ml-pca";
import axios from "axios";
import Sidebar from "./Sidebar";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Group, SphereGeometry, MeshBasicMaterial, Mesh } from "three";
  
/**
 * Liste des passions à afficher dans le graphique sémantique.
 */
const passions = [
  // Musique et arts
  "Music",       // [0.9, 0.1, 0.0, 0.0, 0.0]
  "Dancing",     // [0.8, 0.2, 0.0, 0.0, 0.0]
  "Painting",    // [0.85, 0.15, 0.0, 0.0, 0.0]
  "Writing",     // [0.88, 0.12, 0.0, 0.0, 0.0]
  "Photography", // [0.87, 0.13, 0.0, 0.0, 0.0]
  "Drawing",     // [0.86, 0.14, 0.0, 0.0, 0.0]
  "Sculpting",   // [0.89, 0.11, 0.0, 0.0, 0.0]

  // Sports et activités physiques
  "Sports",      // [0.0, 0.9, 0.1, 0.0, 0.0]
  "Hiking",      // [0.0, 0.85, 0.15, 0.0, 0.0]
  "Running",     // [0.0, 0.88, 0.12, 0.0, 0.0]
  "Cycling",     // [0.0, 0.87, 0.13, 0.0, 0.0]
  "Swimming",    // [0.0, 0.86, 0.14, 0.0, 0.0]
  "Yoga",        // [0.0, 0.89, 0.11, 0.0, 0.0]
  "Martial Arts",// [0.0, 0.84, 0.16, 0.0, 0.0]

  // Loisirs et jeux
  "Gaming",      // [0.0, 0.0, 0.9, 0.1, 0.0]
  "Board Games", // [0.0, 0.0, 0.85, 0.15, 0.0]
  "Puzzles",     // [0.0, 0.0, 0.88, 0.12, 0.0]
  "Collecting",  // [0.0, 0.0, 0.87, 0.13, 0.0]
  "Birdwatching",// [0.0, 0.0, 0.86, 0.14, 0.0]
  "Astronomy",   // [0.0, 0.0, 0.89, 0.11, 0.0]

  // Activités créatives et artisanat
  "Crafting",    // [0.0, 0.0, 0.0, 0.9, 0.1]
  "Knitting",    // [0.0, 0.0, 0.0, 0.85, 0.15]
  "Sewing",      // [0.0, 0.0, 0.0, 0.88, 0.12]
  "Gardening",   // [0.0, 0.0, 0.0, 0.87, 0.13]
  "Volunteering",// [0.0, 0.0, 0.0, 0.86, 0.14]

  // Lecture et méditation
  "Reading",     // [0.0, 0.0, 0.0, 0.0, 0.9]
  "Meditation",  // [0.0, 0.0, 0.0, 0.0, 0.85]
  "Travel",      // [0.0, 0.0, 0.0, 0.0, 0.88]
  "Cooking",     // [0.0, 0.0, 0.0, 0.0, 0.87]
  "Fishing"      // [0.0, 0.0, 0.0, 0.0, 0.86]
];

/**
 * Embeddings utilisés pour la réduction dimensionnelle avec PCA.
 */const embeddings = [
  // Musique et arts
  [0.9, 0.1, 0.3, 0.5, 0.0].map(x => x * 2.3),  // Music
  [0.7, 0.4, 0.2, 0.3, 0.0].map(x => x * 2.3),  // Dancing
  [0.85, 0.3, 0.1, 0.0, 0.0].map(x => x * 2.3), // Painting
  [0.88, 0.2, 0.4, -0.3, 0.0].map(x => x * 2.3), // Writing
  [0.87, 0.5, 0.2, 0.7, 0.0].map(x => x * 2.3), // Photography
  [0.86, 0.6, 0.3, -0.6, 0.0].map(x => x * 2.3), // Drawing
  [0.89, 0.1, 0.5, 0.4, 0.0].map(x => x * 2.3), // Sculpting

  // Sports et activités physiques
  [0.3, 0.9, 0.6, 0.0, 0.0].map(x => x * 2.3),  // Sports
  [0.2, 0.85, 0.7, 0.0, 0.0].map(x => x * 2.3), // Hiking
  [0.1, 0.88, 0.5, 0.0, 0.0].map(x => x * 2.3), // Running
  [0.4, 0.87, 0.6, 0.0, 0.0].map(x => x * 2.3), // Cycling
  [0.5, 0.86, 0.7, 0.0, 0.0].map(x => x * 2.3), // Swimming
  [0.2, 0.89, 0.4, 0.0, 0.0].map(x => x * 2.3), // Yoga
  [0.1, 0.84, 0.8, 0.0, 0.0].map(x => x * 2.3), // Martial Arts

  // Loisirs et jeux
  [0.0, 0.3, 0.9, 0.6, 0.0].map(x => x * 2.3),  // Gaming
  [0.0, 0.2, 0.85, 0.7, 0.0].map(x => x * 2.3), // Board Games
  [0.0, 0.1, 0.88, 0.5, 0.0].map(x => x * 2.3), // Puzzles
  [0.0, 0.4, 0.87, 0.6, 0.0].map(x => x * 2.3), // Collecting
  [0.0, 0.5, 0.86, 0.7, 0.0].map(x => x * 2.3), // Birdwatching
  [0.0, 0.2, 0.89, 0.4, 0.0].map(x => x * 2.3), // Astronomy

  // Activités créatives et artisanat
  [0.0, 0.0, 0.3, 0.9, 0.6].map(x => x * 2.3),  // Crafting
  [0.0, 0.0, 0.2, 0.85, 0.7].map(x => x * 2.3), // Knitting
  [0.0, 0.0, 0.1, 0.88, 0.5].map(x => x * 2.3), // Sewing
  [0.0, 0.0, 0.4, 0.87, 0.6].map(x => x * 2.3), // Gardening
  [0.0, 0.0, 0.5, 0.86, 0.7].map(x => x * 2.3), // Volunteering

  // Lecture et méditation
  [0.0, 0.0, 0.0, 0.3, 0.9].map(x => x * 2.3),  // Reading
  [0.0, 0.0, 0.0, 0.2, 0.85].map(x => x * 2.3), // Meditation
  [0.0, 0.0, 0.0, 0.1, 0.88].map(x => x * 2.3), // Travel
  [0.0, 0.0, 0.0, 0.4, 0.87].map(x => x * 2.3), // Cooking
  [0.0, 0.0, 0.0, 0.5, 0.86].map(x => x * 2.3), // Fishing
];

/**
 * Calcule la distance euclidienne entre deux points.
 * @param {number[]} point1 - Le premier point.
 * @param {number[]} point2 - Le deuxième point.
 * @returns {number} - La distance entre les deux points.
 */
const calculateDistance = (point1, point2) => {
  return Math.sqrt(point1.reduce((sum, value, index) => sum + Math.pow(value - point2[index], 2), 0));
};

/**
 * Composant principal de la page du graphique sémantique.
 * @returns {JSX.Element} - Le rendu du composant.
 */
const SemanticGraphPage = () => {
  const [data, setData] = useState({ nodes: [], links: [] });
  const [delta, setDelta] = useState(0.5);
  const [error, setError] = useState(null);
  const [font, setFont] = useState(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      function (loadedFont) {
        setFont(loadedFont);
      },
      undefined,
      function (err) {
        console.error("Erreur lors du chargement de la police :", err);
        setError("Échec du chargement de la police. Veuillez réessayer plus tard.");
      }
    );
  }, []);

  useEffect(() => {
    const createGraph = () => {
      console.log("Création du graphique...");
      try {
        if (embeddings.length !== passions.length) {
          throw new Error("Le nombre d'embeddings ne correspond pas au nombre de passions.");
        }

        // Effectuer la PCA en 3D
        const pca = new PCA(embeddings);
        const reducedData = pca.predict(embeddings, { nComponents: 3 }).to2DArray();
        console.log("Données réduites (PCA 3D) :", reducedData);

        // Création des nœuds à partir des données réduites
        const nodes = passions.map((passion, idx) => ({
          id: idx,
          name: passion,
          x: reducedData[idx][0],
          y: reducedData[idx][1],
          z: reducedData[idx][2],
          group: Math.floor(Math.random() * 10)
        }));

        const links = [];
        // Calculer toutes les distances en espace 3D
        const distances = nodes.map((node1, idx1) =>
          nodes.map((node2, idx2) =>
            idx1 !== idx2 ? calculateDistance([node1.x, node1.y, node1.z], [node2.x, node2.y, node2.z]) : Infinity
          )
        );

        // Trouver les distances min et max pour la normalisation
        const allDistances = distances.flat().filter(d => d !== Infinity);
        const minDistance = Math.min(...allDistances);
        const maxDistance = Math.max(...allDistances);

        // Créer des liens basés sur le delta normalisé
        nodes.forEach((node1, idx1) => {
          for (let idx2 = idx1 + 1; idx2 < nodes.length; idx2++) {
            const distance = distances[idx1][idx2];
            const normalizedDistance = (distance - minDistance) / (maxDistance - minDistance);
            if (normalizedDistance <= delta) {
              links.push({ source: node1.id, target: nodes[idx2].id, value: 1 - normalizedDistance });
            }
          }
        });

        console.log("Nœuds :", nodes);
        console.log("Liens :", links);

        setData({ nodes, links });
      } catch (err) {
        console.error("Erreur lors de la création du graphique :", err);
        setError("Échec de la création du graphique. Veuillez réessayer plus tard.");
      }
    };

    createGraph();
  }, [delta]);

  /**
   * Gère le changement de valeur du delta via le curseur.
   * @param {React.ChangeEvent<HTMLInputElement>} event - L'événement de changement.
   */
  const handleDeltaChange = (event) => {
    const nouvelleValeur = parseFloat(event.target.value);
    setDelta(nouvelleValeur);
    console.log("Delta changé à :", nouvelleValeur);
  };

  /**
   * Fonction pour obtenir le nom du nœud par ID de manière sécurisée.
   * @param {number} id - L'ID du nœud.
   * @returns {string} - Le nom du nœud ou "Unknown" si non trouvé.
   */
  const getNodeName = (id) => {
    const node = data.nodes.find(n => n.id === id);
    return node ? node.name : "Unknown";
  };

  return (
    <div className="flex h-screen bg-white justify-center items-center">
      <Sidebar />
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 h-[calc(100vh-1rem)] flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">3d semantic graph</h1>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="flex-1 transform scale-75 w-full">
              <ForceGraph3D
                graphData={data}
                nodeAutoColorBy="group"
                nodeLabel={node => node.name}
                linkWidth={link => link.value * 1}
                linkOpacity={1}
                linkColor={() => "#000000"}
                nodeColor={() => "#000000"}
                backgroundColor="#FFFFFF"
                nodeThreeObject={node => {
                  const group = new Group();

                  // Créer la sphère
                  const geometry = new SphereGeometry(5, 32, 32);
                  const material = new MeshBasicMaterial({ color: 0x000000 });
                  const sphere = new Mesh(geometry, material);
                  group.add(sphere);

                  // Créer le texte si la police est chargée
                  if (font) {
                    const textGeometry = new TextGeometry(node.name, {
                      font: font,
                      size: 5,
                      height: 1,
                    });
                    const textMaterial = new MeshBasicMaterial({ color: 0x000000 });
                    const textMesh = new Mesh(textGeometry, textMaterial);
                    textMesh.position.set(10, 10, 0);
                    group.add(textMesh);
                  }

                  return group;
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemanticGraphPage;
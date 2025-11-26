import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";

// Game store item names.
const GAME_ITEMS = [
  "PlayStation 5 Console", "Xbox Series X", "Nintendo Switch OLED", 
  "RTX 4090 Graphics Card", "Logitech G Pro Mouse", "Razer BlackWidow Keyboard",
  "HyperX Cloud II Headset", "Samsung Odyssey Monitor", "Steam Deck 512GB",
  "Elden Ring (PS5)", "Cyberpunk 2077 (PC)", "DualSense Controller",
  "Xbox Elite Controller", "Secretlab Titan Chair", "Elgato Stream Deck",
  "Blue Yeti Microphone", "Oculus Quest 2", "NVMe SSD 2TB",
  "DDR5 RAM 32GB", "Gaming Laptop MSI Raider"
];

// Transform API data into game store data.
const processGameData = (apiData) => {
  let fullList = [];
  
  // Create 5 batches to reach 100 items.
  for (let i = 0; i < 5; i++) {
    const batch = apiData.map((item, index) => {
      const newId = (i * 20) + index + 1;
      const gameName = GAME_ITEMS[newId % GAME_ITEMS.length];
      const stock = Math.floor(Math.random() * 80) + 5; 
      const sales = Math.floor(Math.random() * 60) + 5; 
      const leadTime = Math.floor(Math.random() * 10) + 1; 
      
      // Return structured game item.
      return {
        id: newId,
        name: gameName,
        stock: stock,
        avgSales: sales,
        leadTime: leadTime,
        mlFeatures: [stock, sales, leadTime], 
        prediction: "Pending"
      };
    });
    fullList = [...fullList, ...batch];
  }
  return fullList.slice(0, 100);
};

// Main app component
export default function App() {
  const [products, setProducts] = useState([]);
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState("Waiting for user action...");
  const [isTraining, setIsTraining] = useState(false);

  // Fetch data from the API.
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product data from fake store API.
        setStatus("Fetching product data from API...");
        const response = await fetch("https://fakestoreapi.com/products");
        const json = await response.json();
        
        // Process and set products state.
        const gameInventory = processGameData(json);
        setProducts(gameInventory);
        setStatus("Data loaded. Ready to train model.");
      } catch (err) {
        console.error(err);
        setStatus("Error loading API data.");
      }
    };
    fetchData();
  }, []);

  // Train the model for predicting reorder needs.
  const trainModel = async () => {
    setIsTraining(true);
    setStatus("Training Model... Please wait.");

    // Example training data (stock, avgSales, leadTime)
    const trainingData = tf.tensor2d([
      [20, 50, 3], // Don't reorder (0)
      [5, 30, 5],  // Reorder (1)
      [15, 40, 4], // Don't reorder (0)
      [8, 60, 2],  // Reorder (1)
    ]);
    
    // Labels: 1 = reorder, 0 = don't reorder
    const outputData = tf.tensor2d([[0], [1], [0], [1]]);
    
    // Define the model. 
    const newModel = tf.sequential();
    newModel.add(tf.layers.dense({ inputShape: [3], units: 8, activation: "relu"}));
    newModel.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    
    // Compile and train model.
    newModel.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
    
    await newModel.fit(trainingData, outputData, {
      epochs: 200,
      shuffle: true,
    });

    // Update state with trained model.
    setModel(newModel);
    setIsTraining(false);
    setStatus("Model Trained! Ready to predict.");
    
    trainingData.dispose();
    outputData.dispose();
  };

  // Predict reorder needs for products. 
  const predictReorder = async () => {
    if (!model) return;
    setStatus("Analyzing 100 products...");

    // Perform predictions on each product.
    const updatedProducts = products.map((p) => {
      const input = tf.tensor2d([p.mlFeatures]);
      const result = model.predict(input);
      const riskScore = result.dataSync()[0];
      
      input.dispose();
      result.dispose();

      // Determine prediction based on risk score threshold.
      return {
        ...p,
        prediction: riskScore > 0.5 ? "Reorder" : "Sufficient",
        score: riskScore.toFixed(2)
      };
    });

    // Update state with predictions.
    setProducts(updatedProducts);
    setStatus("Analysis Complete. Check Dashboard below.");
  };

  // Helper to determine status color.
  const getStatusClass = (msg) => {
    if (msg.includes("Training") || msg.includes("Analyzing") || msg.includes("Fetching")) return "status-processing";
    if (msg.includes("Trained") || msg.includes("Complete") || msg.includes("Ready")) return "status-success";
    return "status-idle";
  };

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <section className="control-panel">
          <h2>Inventory Reorder Predictor Dashboard</h2>
          
          {/* Dynamic Colored Status Badge */}
          <div className={`status-badge ${getStatusClass(status)}`}>
            System Status: <strong>{status}</strong>
          </div>
          
          <div className="button-group">
            <button 
              className="action-btn btn-primary" 
              onClick={trainModel}
              disabled={isTraining || model !== null}
            >
              {isTraining ? "Training..." : "Train AI Model"}
            </button>
            
            <button 
              className="action-btn btn-primary" 
              onClick={predictReorder}
              disabled={!model}
            >
              Run Prediction
            </button>
          </div>
        </section>

        <section className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Stock Level</th>
                <th>Avg Sales/Week</th>
                <th>Lead Time (Days)</th>
                <th>Reorder Prediction</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td style={{ fontWeight: "500" }}>{item.name}</td>
                  <td>{item.stock} units</td>
                  <td>{item.avgSales}</td>
                  <td>{item.leadTime} days</td>
                  <td>
                    <span className={`badge badge-${item.prediction.toLowerCase() === 'reorder' ? 'reorder' : item.prediction.toLowerCase() === 'sufficient' ? 'ok' : 'pending'}`}>
                      {item.prediction === 'Reorder' ? 'Restock Needed' : item.prediction === 'Sufficient' ? 'Sufficient' : 'Waiting...'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <Footer />
    </div>
  );
}
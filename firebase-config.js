const firebaseConfig = {
    apiKey: "AIzaSyAPU-R6OJIAVtem_hJVJ4ZnjxFk_tpGBvs",
    authDomain: "optimoveassets.firebaseapp.com",
    databaseURL: "https://optimoveassets-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "optimoveassets",
    storageBucket: "optimoveassets.firebasestorage.app",
    messagingSenderId: "523129202709",
    appId: "1:523129202709:web:d67269418d280ceaf3461c",
    measurementId: "G-B7PKKJ167E"
};

// Инициализация
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const assetsRef = database.ref('shared_assets');
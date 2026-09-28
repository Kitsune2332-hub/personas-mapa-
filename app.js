import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot
} from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// =====================================
// FIREBASE
// =====================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


// =====================================
// ELEMENTOS
// =====================================

const roleSelection =
  document.getElementById("roleSelection");

const studentBtn =
  document.getElementById("studentBtn");

const teacherBtn =
  document.getElementById("teacherBtn");

const loginSection =
  document.getElementById("login");

const dashboard =
  document.getElementById("dashboard");

const appSection =
  document.getElementById("app");

const loginTitle =
  document.getElementById("loginTitle");

const roleText =
  document.getElementById("roleText");

const backRoleBtn =
  document.getElementById("backRoleBtn");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const registerBtn =
  document.getElementById("registerBtn");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const shareBtn =
  document.getElementById("shareBtn");

const stopBtn =
  document.getElementById("stopBtn");

const status =
  document.getElementById("status");


// =====================================
// VARIABLES
// =====================================

let watchId = null;

let map = null;

let markers = {};

let selectedRole = null;


// =====================================
// SELECCIÓN DE ROL
// =====================================

studentBtn.addEventListener("click", () => {

  selectedRole = "student";

  loginTitle.textContent =
    "Iniciar sesión como estudiante";

  roleText.textContent =
    "Como estudiante podrás consultar la ubicación de los profesores.";

  roleSelection.hidden = true;

  loginSection.hidden = false;

});


teacherBtn.addEventListener("click", () => {

  selectedRole = "teacher";

  loginTitle.textContent =
    "Iniciar sesión como profesor";

  roleText.textContent =
    "Como profesor podrás compartir tu ubicación dentro de la institución.";

  roleSelection.hidden = true;

  loginSection.hidden = false;

});


// =====================================
// VOLVER
// =====================================

backRoleBtn.addEventListener("click", () => {

  selectedRole = null;

  loginSection.hidden = true;

  roleSelection.hidden = false;

  emailInput.value = "";

  passwordInput.value = "";

});


// =====================================
// CREAR MAPA
// =====================================

function initializeMap() {

  if (map) return;

  map = L.map("map").setView(
    [4.711, -74.072],
    12
  );

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

}


// =====================================
// REGISTRO
// =====================================

registerBtn.addEventListener(
  "click",
  async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      alert(
        "Completa correo y contraseña."
      );

      return;

    }


    if (!selectedRole) {

      alert(
        "Selecciona si eres estudiante o profesor."
      );

      return;

    }


    try {

      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Cuenta creada correctamente.");

    }

    catch (error) {

      alert(error.message);

    }

  }
);


// =====================================
// LOGIN
// =====================================

loginBtn.addEventListener(
  "click",
  async () => {

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      alert(
        "Completa correo y contraseña."
      );

      return;

    }


    if (!selectedRole) {

      alert(
        "Selecciona si eres estudiante o profesor."
      );

      return;

    }


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      /*
       El cambio de pantalla lo hará
       onAuthStateChanged().
      */

    }

    catch (error) {

      alert(error.message);

    }

  }
);


// =====================================
// MOSTRAR PANEL
// =====================================

function mostrarDashboard() {

  roleSelection.hidden = true;

  loginSection.hidden = true;

  appSection.hidden = true;

  dashboard.hidden = false;

}


// =====================================
// IR AL MAPA
// =====================================

function irAlMapa() {

  dashboard.hidden = true;

  appSection.hidden = false;

  initializeMap();

  setTimeout(() => {

    map.invalidateSize();

  }, 200);

}


// =====================================
// SELECCIONAR PROFESOR
// =====================================

function seleccionarProfesor(nombre) {

  console.log(
    "Profesor seleccionado:",
    nombre
  );


  localStorage.setItem(
    "profesorSeleccionado",
    nombre
  );


  irAlMapa();

}


// =====================================
// LOGOUT DEL MAPA
// =====================================

logoutBtn.addEventListener(
  "click",
  async () => {

    await cerrarSesion();

  }
);


// =====================================
// CERRAR SESIÓN
// =====================================

async function cerrarSesion() {

  if (watchId !== null) {

    navigator.geolocation.clearWatch(
      watchId
    );

    watchId = null;

  }


  await signOut(auth);

}


// =====================================
// COMPARTIR UBICACIÓN
// =====================================

shareBtn.addEventListener(
  "click",
  () => {

    if (!navigator.geolocation) {

      alert(
        "Tu navegador no permite obtener ubicación."
      );

      return;

    }


    const user =
      auth.currentUser;


    if (!user) return;


    if (selectedRole !== "teacher") {

      alert(
        "Los estudiantes no pueden compartir su ubicación."
      );

      return;

    }


    status.textContent =
      "Solicitando permiso de ubicación...";


    watchId =
      navigator.geolocation.watchPosition(

        async position => {

          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;


          await setDoc(
            doc(
              db,
              "locations",
              user.uid
            ),
            {
              latitude: latitude,
              longitude: longitude,
              email: user.email,
              updatedAt: Date.now(),
              sharing: true
            }
          );


          status.textContent =
            "Tu ubicación se está compartiendo.";

        },


        error => {

          console.error(error);

          status.textContent =
            "No se pudo obtener tu ubicación.";

        },


        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }

      );

  }
);


// =====================================
// DEJAR DE COMPARTIR
// =====================================

async function stopSharing() {

  const user =
    auth.currentUser;


  if (watchId !== null) {

    navigator.geolocation.clearWatch(
      watchId
    );

    watchId = null;

  }


  if (user) {

    await deleteDoc(
      doc(
        db,
        "locations",
        user.uid
      )
    );

  }


  status.textContent =
    "Tu ubicación ya no se comparte.";

}


stopBtn.addEventListener(
  "click",
  stopSharing
);


// =====================================
// MOSTRAR UBICACIONES
// =====================================

function listenLocations() {

  const locationsRef =
    collection(
      db,
      "locations"
    );


  onSnapshot(
    locationsRef,
    snapshot => {

      snapshot.docChanges()
        .forEach(change => {

          const id =
            change.doc.id;


          if (
            change.type === "added" ||
            change.type === "modified"
          ) {

            const data =
              change.doc.data();


            const position = [
              data.latitude,
              data.longitude
            ];


            if (markers[id]) {

              markers[id].setLatLng(
                position
              );

            }

            else {

              markers[id] =
                L.marker(position)
                  .addTo(map)
                  .bindPopup(
                    data.email
                  );

            }

          }


          if (change.type === "removed") {

            if (markers[id]) {

              map.removeLayer(
                markers[id]
              );

              delete markers[id];

            }

          }

        });

    }
  );

}


// =====================================
// BOTONES DEL MENÚ
// =====================================

function activarBotonMenu(numero) {

  const botones =
    document.querySelectorAll(
      ".menu-btn"
    );


  botones.forEach(
    boton => {

      boton.classList.remove(
        "active"
      );

    }
  );


  if (botones[numero]) {

    botones[numero].classList.add(
      "active"
    );

  }

}


// =====================================
// INICIO
// =====================================

window.mostrarInicio = function() {

  activarBotonMenu(0);

};


// =====================================
// PERFIL
// =====================================

window.mostrarPerfil = function() {

  activarBotonMenu(1);

  alert(
    "Aquí aparecerá el perfil del usuario."
  );

};


// =====================================
// ESTADÍSTICAS
// =====================================

window.mostrarEstadisticas = function() {

  activarBotonMenu(2);

  alert(
    "Aquí aparecerán las estadísticas."
  );

};


// =====================================
// DATOS
// =====================================

window.mostrarDatos = function() {

  activarBotonMenu(3);

  alert(
    "Aquí aparecerán los datos."
  );

};


// =====================================
// CONFIGURACIÓN
// =====================================

window.mostrarConfiguracion = function() {

  activarBotonMenu(4);

  alert(
    "Aquí aparecerá la configuración."
  );

};


// =====================================
// MAPA
// =====================================

window.irAlMapa = function() {

  irAlMapa();

};


// =====================================
// SELECCIONAR PROFESOR
// =====================================

window.seleccionarProfesor =
  function(nombre) {

    seleccionarProfesor(nombre);

  };


// =====================================
// CERRAR SESIÓN DESDE EL PANEL
// =====================================

window.cerrarSesion =
  function() {

    cerrarSesion();

  };


// =====================================
// AUTENTICACIÓN
// =====================================

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      /*
       El usuario ya está autenticado.
       En lugar de enviarlo directamente
       al mapa, lo mandamos al panel.
      */

      mostrarDashboard();


      /*
       Preparamos el mapa para cuando
       el usuario seleccione un profesor.
      */

      initializeMap();


      /*
       Escuchamos las ubicaciones
       de Firebase.
      */

      listenLocations();

    }

    else {

      /*
       Usuario no autenticado.
       Mostramos la selección de rol.
      */

      dashboard.hidden = true;

      appSection.hidden = true;

      loginSection.hidden = true;

      roleSelection.hidden = false;

    }

  }
);
let password_input = document.getElementById("passwordSignup");
let box1 = document.getElementById("strenght_password_box_1");
let box2 = document.getElementById("strenght_password_box_2");
let box3 = document.getElementById("strenght_password_box_3");

let strongPassword = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})');
let mediumPassword = new RegExp('((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,}))');

function StrengthChecker(PasswordParameter) {
    if (strongPassword.test(PasswordParameter)) {
        box1.style.backgroundColor = "green";
        box2.style.backgroundColor = "green";
        box3.style.backgroundColor = "green";
    } else if (mediumPassword.test(PasswordParameter)) {
        box1.style.backgroundColor = "orange";
        box2.style.backgroundColor = "orange";
        box3.style.backgroundColor = "gray";
    } else if (PasswordParameter == '') {
        box1.style.backgroundColor = "gray";
        box2.style.backgroundColor = "gray";
        box3.style.backgroundColor = "gray";
    } else {
        box1.style.backgroundColor = "red";
        box2.style.backgroundColor = "gray";
        box3.style.backgroundColor = "gray";
    }
}

// Ajoute un événement sur l'input pour vérifier la rigidité du mot de passe après que l'utilisateur l'ait tapé
password_input.addEventListener("input", () => {
    StrengthChecker(password_input.value);
});

var switchLoginForm = function(e) {
    let exActive = document.querySelector(".login.active");
    exActive.classList.remove("active");
    exActive.classList.add("inactive");

    e.currentTarget.classList.remove("inactive");
    e.currentTarget.classList.add("active");

    let inactive = document.querySelector(".login.inactive");
    inactive.addEventListener("click", switchLoginForm, true);

    // Enlever le required des formulaires
    let usernameLogin = document.getElementById("usernameLogin");
    if (usernameLogin.required) {
        // Disable Login
        document.getElementById("usernameLogin").required = false;
        document.getElementById("passwordLogin").required = false;
        // Enable Signup
        document.getElementById("usernameSignup").required = true;
        document.getElementById("passwordSignup").required = true;
        // Enable password checker
    } else {
        // Disable Signup
        document.getElementById("usernameSignup").required = false;
        document.getElementById("passwordSignup").required = false;
        // Enable Login
        document.getElementById("usernameLogin").required = true;
        document.getElementById("passwordLogin").required = true;
        // Disable password checker
    }

    // Remplaçage du formulaire
    let hiddenForm = document.querySelector(".log-form.hidden");
    let activeForm = document.querySelector(".log-form.visible");
    activeForm.classList.remove("visible");
    activeForm.classList.add("hidden");
    hiddenForm.classList.remove("hidden");
    hiddenForm.classList.add("visible");

};

// ToDo: passer en JQueries
var printErrorLoginForm = function(res) {
    // ToDo: ne pas filtrer par status code et garder qu'une seule ligne de message d'erreur en printant dedans res.message
    // get("ErrorField")
    // ErrorField.innerHTML = res.message
    // rendre visible
    console.log(res);
    if (res.status === 409) {
        document.getElementById("errorRegister").classList.remove("hidden");
        document.getElementById("errorRegister").classList.add("visible");
    } else if (res.status === 400) {
        document.getElementById("errorLoginID").classList.remove("hidden");
        document.getElementById("errorLoginID").classList.add("visible");
        document.getElementById("errorLoginPwd").classList.remove("hidden");
        document.getElementById("errorLoginPwd").classList.add("visible");
    }
}

let inactive = document.querySelector(".login.inactive");
inactive.addEventListener("click", switchLoginForm, true);


// Send login-form manually
let loginform = document.querySelector("#login-form")
loginform.addEventListener('submit', async(e) => {

    let body = {
        usernameLogin: loginform.elements.usernameLogin.value,
        passwordLogin: loginform.elements.passwordLogin.value
    }

    e.preventDefault();

    const res = await fetch('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })

    const data = res.json();
    data.then(response => {
        if (response.status === 200) {
            window.location = response.redirect;
        } else {
            // ToDo: print errors
            printErrorLoginForm(response)
        }
    }).catch(error => console.error('Error:', error))
})

// Send register-form manually
let registerform = document.querySelector("#register-form")
registerform.addEventListener('submit', async(e) => {

    let body = {
        usernameSignup: registerform.elements.usernameSignup.value,
        passwordSignup: registerform.elements.passwordSignup.value
    }

    e.preventDefault();

    const res = await fetch('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    })

    const data = res.json();
    data.then(response => {
        if (response.status === 201) {
            window.location = response.redirect;
        } else {
            printErrorLoginForm(response)
        }
    }).catch(error => console.error('Error:', error))
})
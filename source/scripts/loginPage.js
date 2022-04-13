
var switchLoginForm = function (e) {
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
    document.getElementById("emailSignup").required = true;
    document.getElementById("passwordSignup").required = true;
  }
  else {
    // Disable Signup
    document.getElementById("usernameSignup").required = false;
    document.getElementById("emailSignup").required = false;
    document.getElementById("passwordSignup").required = false;
    // Enable Login
    document.getElementById("usernameLogin").required = true;
    document.getElementById("passwordLogin").required = true;
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
  if(res.status === 409) {
    document.getElementById("errorRegister").classList.remove("hidden");
    document.getElementById("errorRegister").classList.add("visible");
  } else if(res.status === 400) {
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
loginform.addEventListener('submit', async (e) => {
  
  let body = {
    usernameLogin: loginform.elements.usernameLogin.value,
    passwordLogin: loginform.elements.passwordLogin.value
  }

  e.preventDefault();

  const res = await fetch('/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })

  const data = res.json();
  data.then(response => {
    if (response.status === 200) {
      window.location = response.redirect;
    }
    else {
      // ToDo: print errors
      printErrorLoginForm(response)
    }
  }).catch(error => console.error('Error:', error))
})

// Send register-form manually
let registerform = document.querySelector("#register-form")
registerform.addEventListener('submit', async (e) => {
  
  let body = {
    usernameSignup: registerform.elements.usernameSignup.value,
    emailSignup: registerform.elements.emailSignup.value,
    passwordSignup: registerform.elements.passwordSignup.value
  }

  e.preventDefault();

  const res = await fetch('/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
  })

  const data = res.json();
  data.then(response => {
    if (response.status === 201) {
      window.location = response.redirect;
    }
    else {
      printErrorLoginForm(response)
    }
  }).catch(error => console.error('Error:', error))
})


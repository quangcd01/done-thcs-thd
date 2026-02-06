const firebaseConfig = {
    apiKey: "AIzaSyCbc7qwpgfuNArldNvtyfx3HlfEJYE28Ec",
    authDomain: "thcs-thd.firebaseapp.com",
    databaseURL: "https://thcs-thd-default-rtdb.firebaseio.com",
    projectId: "thcs-thd",
    storageBucket: "thcs-thd.firebasestorage.app",
    messagingSenderId: "45700741272",
    appId: "1:45700741272:web:908d54b8ff78c1354bb8ed",
    measurementId: "G-H0JP5VFM5R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

const auth = firebase.auth()
const database = firebase.database()

function signUp() {
    var email = document.getElementById("e-Sign").value
    var password = document.getElementById("pwd-Sign").value
    var cfPassword = document.getElementById("cfPwd-Sign").value

    if (password !== cfPassword) {
        alert("Mật khẩu nhập không khớp !!!")
        return
    }

    // Validate input fields
    if (validate_email(email) == false || validate_password(password) == false) {
        alert('Email or Password is Invalid!!!')
        return
        // Don't continue running the code
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            // Declare user variable
            var user = auth.currentUser
            // Add this user to Firebase Database
            var database_ref = database.ref()
            // Create User data
            var user_data = {
                email: email,
                password: password,
                last_login: Date.now()
            }
            // Push to Firebase Database
            database_ref.child('users/' + user.uid).set(user_data)
            // DOne
            // alert('Successfully!!!')
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            // Firebase will use this to alert of its errors
            var error_message = error.message
            alert(error_message)
        })
}


function validate_email(email) {
    // regex 1 chuỗi ký tự hỗ trợ mình kiểm tra gì đó,
    expression = /^[^@]+@\w+(\.\w+)+\w$/
    if (expression.test(email) == true) {
        // Email is good
        return true;
    } else {
        // Email is bad
        return false;
    }
}

function validate_password(password) {
    expression = /^[A-Za-z]\w{7,14}$/
    // Firebase only accepts lengths greater than 6
    if (expression.test(password) == true) {
        return true;
    } else {
        return false;
    }
}


document.getElementById("btn-Sign").addEventListener("click", () => {
    signUp()
});


// Login function - 12/12/2025

function LogIn() {
    var email = document.getElementById("e-Login").value
    var password = document.getElementById("pwd-Login").value

    if (validate_email(email) == false || validate_password(password) == false) {
        alert('Email or Password is Invalid!!!')
        return
        // Don't continue running the code
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Declare user variable
            var user = auth.currentUser;

            // Add this user to Firebase Database
            var database_ref = database.ref();

            // Create User data
            var user_data = {
                last_login: Date.now()
            };

            // Push to Firebase Database
            database_ref.child('users/' + user.uid).update(user_data);

            // DOne
            // alert('Đăng nhập thành công!!!');
            window.location.href = "dashboard.html";

        })
        .catch((error) => {
            // Firebase will use this to alert of its errors
            var error_message = error.message;

            alert(error_message);
        })
}

document.getElementById("btn-Login").addEventListener("click", () => {
    LogIn()
})
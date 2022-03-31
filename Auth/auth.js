const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
    try {
        // Get user input
        console.log(req.body);
        const { usernameSignup, emailSignup, passwordSignup } = req.body;

        // Validate user input
        if (!(emailSignup && passwordSignup && usernameSignup)) {
            res.status(400).send("All input is required");
            return;
        }

        // if (passwordSignup.length < 6) {
        //     return res.status(400).json({ message: "Password less than 6 characters" });
        // }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ usernamelowercase:usernameSignup.toLowerCase() });

        if (oldUser) {
            return res.status(409).send("Username Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedUserPassword = await bcrypt.hash(passwordSignup, 10);

        // Create user in our database
        const user = await User.create({
            usernamelowercase: usernameSignup.toLowerCase(),
            username: usernameSignup,
            email: emailSignup.toLowerCase(), // sanitize
            password: encryptedUserPassword,
        });
    
        // Create token
        const token = jwt.sign(
            { user_id: user._id, usernameSignup },
            process.env.TOKEN_KEY,
            {
            expiresIn: "5h",
            }
        );
        // save user token
        user.token = token;
        // ToDo: update le token dans la DB (confirmer que c'est bien comme ça)
        await User.updateOne({usernamelowercase:usernameSignup.toLowerCase()}, {$set: {token:token}});

        res.cookie("jwt", token, {
            httpOnly: true,
            expiresIn: "5h", // 3hrs in ms
        });
        
        // return new user
        return res.status(201).redirect("/home");
        // res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        // Get user input
        console.log(req.body);
        const { usernameLogin, passwordLogin } = req.body;

        // Validate user input
        if (!(usernameLogin && passwordLogin)) {
            res.status(400).send("All input is required");
        }
        
        // Validate if user exist in our database
        const user = await User.findOne({ usernamelowercase:usernameLogin.toLowerCase() });

        if (user && (await bcrypt.compare(passwordLogin, user.password))) {  
            // Create token
            const token = jwt.sign(
                { user_id: user._id, usernameLogin },
                process.env.TOKEN_KEY,
                {
                expiresIn: "5h",
                }
            );

            // save user token
            user.token = token;
            
            // ToDo: update le token dans la DB (confirmer que c'est bien comme ça)
            await User.updateOne({usernamelowercase:usernameLogin.toLowerCase()}, {$set: {token:token}});

            res.cookie("jwt", token, {
                httpOnly: true,
                expiresIn: "5h", // 3hrs in ms
            });
            // user
            // return res.status(200).json(user);
            // res.set('x-access-token', token);
            return res.status(200).redirect("/home");
        }
        return res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
};
/*
exports.update = async (req, res, next) => {
  const { role, id } = req.body;
  // Verifying if role and id is presnt
  if (role && id) {
    // Verifying if the value of role is admin
    if (role === "admin") {
      // Finds the user with the id
      await User.findById(id)
        .then((user) => {
          // Verifies the user is not an admin
          if (user.role !== "admin") {
            user.role = role;
            user.save((err) => {
              //Monogodb error checker
              if (err) {
                return res
                  .status("400")
                  .json({ message: "An error occurred", error: err.message });
                process.exit(1);
              }
              res.status("201").json({ message: "Update successful", user });
            });
          } else {
            res.status(400).json({ message: "User is already an Admin" });
          }
        })
        .catch((error) => {
          res
            .status(400)
            .json({ message: "An error occurred", error: error.message });
        });
    } else {
      res.status(400).json({
        message: "Role is not admin",
      });
    }
  } else {
    res.status(400).json({ message: "Role or Id not present" });
  }
};

exports.deleteUser = async (req, res, next) => {
  const { id } = req.body;
  await User.findById(id)
    .then((user) => user.remove())
    .then((user) =>
      res.status(201).json({ message: "User successfully deleted", user })
    )
    .catch((error) =>
      res
        .status(400)
        .json({ message: "An error occurred", error: error.message })
    );
};
*/

exports.getUsers = async (req, res, next) => {
    await User.find({})
        .then((users) => {
        const userFunction = users.map((user) => {
            const container = {};
            container.username = user.username;
            container.email = user.email;
            container.id = user._id;

            return container;
        });
        res.status(200).json({ user: userFunction });
    })
    .catch((err) =>
      res.status(401).json({ message: "Not successful", error: err.message })
    );
};

exports.getUsername = async (req, res, next) => {
    if (!req.cookies.jwt) 
        return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter votre pseudo." });
    try {
        
        const user = await User.findOne({ token:req.cookies.jwt });
        if (!user) 
          return res.status(409).json({error: "User not found. Please logout and re-login.", username: "Undefined"});
        return res.status(200).json({ username: user.username, email: user.email });
    } catch (err) {
        res.status(401).json({ message: "Not successful", error: err.message })
    }
    //   .then((user) => {
    //     const userFunction = users.map((user) => {
    //       const container = {};
    //       container.username = user.username;
    //       container.email = user.email;
    //       container.id = user._id;
  
    //       return container;
        // });
        // res.status(200).json({ user: userFunction });
    //   })
    //   .catch((err) =>
    //     res.status(401).json({ message: "Not successful", error: err.message })
    //   );
  };

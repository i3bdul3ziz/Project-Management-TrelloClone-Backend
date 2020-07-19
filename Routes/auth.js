const express = require("express");
const router = express.Router();
require("dotenv").config();
const User = require("../Models/User.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/signup", (req, res) => {
  const newUser = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
  };
  User.findOne({ email: newUser.email })
    .then((user) => {
      if (!user) {
        bcrypt.hash(newUser.password, 10, (err, hash) => {
          newUser.password = hash;
          User.create(newUser)
            .then(() => {
              res.json({
                msg: "تم إنشاء حساب بنجاح",
                userInf: newUser,
                register: true,
              });
            })
            .catch((err) => {});
        });
      } else {
        res.json({
          msg: "البريد الإلكتروني موجود, للدخول اذهب إلى صفحة تسجيل الدخول",
          register: false,
        });
      }
    })
    .catch((err) => {
      res.json(err);
    });
});

router.post("/signin", (req, res) => {
  const Signin = {
    email: req.body.email,
    password: req.body.password,
  };

  User.findOne({ email: Signin.email })
    .then((user) => {
      if (user) {
        if (bcrypt.compareSync(Signin.password, user.password)) {
          user.password = undefined;
          let payload = { user };
          let token = jwt.sign(payload, "SECRET");

          res.json({ token, Signin: true });
        } else {
          res.json({ msg: "معلومات تسجيل الدخول غير صحيحة" });
        }
      } else {
        res.json({ msg: "معلومات تسجيل الدخول غير صحيحة" });
      }
    })
    .catch((err) => res.json(err));
});

router.post("/forgetpass", (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user)
      return res.json({
        errorMsg: "البريد الإلكتروني غير مسجل بعد",
        state: "error",
      });
    user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordExpires = Date.now() + 36000000;
    user.save().then((user) => {
      const msg = {
        to: user.email,
        from: "labdul2ziz@gmail.com",
        subject: "Reset Password",
        text: " ",
        html: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n +
        http://localhost:3000/reset/${user.resetPasswordToken}
        \n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n
        `,
      };
      sgMail
        .send(msg)
        .then(() =>
          res.json({
            successMsg: "تم ارسال بريد إلكتروني , الرجاء تفقُد البريد",
            state: "success",
          })
        )
        .catch((err) => res.json({ msg: err }));
    });
  });
});

router.post("/reset/:token", (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token }).then((user) => {
    if (!user)
      return res.json({
        errorMsg: "البريد الإلكتروني غير مسجل بعد",
        state: "error",
      });
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      user.password = hash;
      user.save().then(() =>
        res.json({
          successMsg: "تم تغيير كلمة المرور بنجاح",
          state: "success",
        })
      );
    });
  });
});

module.exports = router;

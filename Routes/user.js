const express = require("express");
const router = express.Router();
const User = require("../Models/User.model");
const isLoggedIn = require("../config/config");

router.get("/:id/profile", isLoggedIn, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    user.password = undefined;
    res.status(200).json({ user });
  } catch (error) {
    res.status(400).json({ message: "حدث خطأ الرجاء العودة للصفحة الرئيسية" });
  }
});

router.put("/:id/profile/edit", isLoggedIn, (req, res) => {
  let userNew = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
  };

  User.findByIdAndUpdate(
    req.params.id,
    { $set: userNew },
    {
      new: true,
    }
  )
    .then((user) => {
      user.password = undefined;
      res.json({
        profile: user,
        successMsg: "تم تعديل بيانات المستخدم بنجاح",
        state: "success",
      });
    })
    .catch((err) => {
      res
        .status(400)
        .json({ errorMsg: "حدث خطأ الرجاء تحديث الصفحة", state: "error" });
    });
});

module.exports = router;

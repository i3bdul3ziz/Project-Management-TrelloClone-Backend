const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const router = express.Router();
const User = require("../Models/User.model");
const Project = require("../Models/Project.model");
const isLoggedIn = require("../config/config");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get("/:userId", isLoggedIn, async (req, res) => {
  try {
    let user = await User.findById(req.params.userId).populate({
      path: "projects.project",
      model: "Project",
    });
    let projects = user.projects;
    user.password = undefined;
    let payload = { user };
    let newToken = jwt.sign(payload, "SECRET");

    return res.json({ newToken, projects }).status(200);
  } catch (error) {
    return res.json({ message: "لا توجد مشاريع" }).status(400);
  }
});

router.post("/:userId", isLoggedIn, (req, res) => {
  const newProject = {
    projectName: req.body.projectName,
    users: req.user._id,
  };

  let project = new Project(newProject);
  project
    .save()
    .then(() => {
      User.findById(req.params.userId, (err, user) => {
        user.projects.push({ project: project, havePermission: true });
        user.save();
      });
      res.json({
        successMsg: "تم إنشاء مشروع جديد بنجاح",
        state: "success",
        projectInfo: newProject,
      });
    })
    .catch((err) => {
      res.json({
        errorMsg: "حدث خطأ, لا يمكن انشاء مشروع جديد",
        state: "error",
      });
    });
});

router.get("/:userId/:projectId", isLoggedIn, async (req, res) => {
  try {
    let project = await Project.findById(req.params.projectId).populate({
      path: "users",
      model: "User",
    });
    project.users.forEach((user) => {
      user.password = undefined;
    });
    return res.json({ project }).status(200);
  } catch (error) {
    return res.json({ message: "لا يوجد قوائم" }).status(400);
  }
});

router.post("/:userId/:projectId", isLoggedIn, (req, res) => {
  let newCard = {
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
  };

  Project.findById(req.params.projectId, (err, project) => {
    project.cards.push(newCard);
    project.save();
  })
    .then(() => {
      res.json({
        msg: "تم انشاء قائمة جديدة بنجاح",
        cardInfo: newCard,
      });
    })
    .catch((err) => {});
});

router.put("/:userId/:projectId", isLoggedIn, async (req, res) => {
  try {
    Project.findByIdAndUpdate(
      {
        _id: req.params.projectId,
      },
      {
        $set: { cards: JSON.parse(req.body.lists) },
      },
      {
        new: true,
      }
    )
      .then((log) => {
        if (!log) {
          return Promise.reject({
            status_code: 404,
            message: "Log not found.",
          });
        }

        res.status(200).send("OK");
      })
      .catch((error) => {
        res.status(error.status_code).send(error.message);
      });
  } catch (err) {}
});

router.put("/:userId/:projectId/:listI", isLoggedIn, (req, res) => {
  let newTask = { taskTitle: req.body.taskTitle };

  Project.findByIdAndUpdate(req.params.projectId)
    .then((project) => {
      project.cards.forEach((card, index) => {
        if (index.toString() === req.params.listI) {
          card.items.push(newTask);
          project.save();
        }
      });
      res.json({
        msg: "تم انشاء مهمة جديدة بنجاح",
        taskInfo: newTask,
      });
    })
    .catch((err) => {});
});

router.put("/:userId/:projectId/:listI/:itemI", isLoggedIn, (req, res) => {
  let editedTask = req.body.editTaskTitle;

  Project.findByIdAndUpdate(req.params.projectId)
    .then((project) => {
      project.cards[req.params.listI].items[
        req.params.itemI
      ].taskTitle = editedTask;
      project.save();
      res.json({
        msg: "تم تعديل المهمة بنجاح",
        taskInfo: editedTask,
      });
    })
    .catch((err) => {});
});

router.put(
  "/:userId/:projectId/:listI/:itemI/task/del",
  isLoggedIn,
  (req, res) => {
    let newList = req.body;
    Project.findById(req.params.projectId)
      .then((project) => {
        project.cards = newList;
        project.save();
        res.json({ message: "تمت إزالة المهمة بنجاح" }).status(200);
      })
      .catch((err) => {
        res.json({ message: "حدث خطأ, لا يمكن إزالة المهمة" }).status(400);
      });
  }
);

router.put(
  "/:userId/:projectId/:listI/:newGrpI/moveall",
  isLoggedIn,
  (req, res) => {
    let newList = req.body;
    Project.findById(req.params.projectId)
      .then((project) => {
        project.cards = newList;
        project.save();
        res
          .json({ message: "تم نقل جميع المهام إلى القائمة الأخرى" })
          .status(200);
      })
      .catch((err) => {
        res.json({ message: "حدث خطأ,لا يمكن نقل المهام" }).status(400);
      });
  }
);

router.put(
  "/:userId/:projectId/:listI/tasks/delall",
  isLoggedIn,
  (req, res) => {
    let newList = req.body;
    Project.findById(req.params.projectId)
      .then((project) => {
        project.cards = newList;
        project.save();
        res.json({ message: "تم حذف جميع المهام في القائمة" }).status(200);
      })
      .catch((err) => {
        res.json({ message: "حدث خطأ,لا يمكن حذف المهام" }).status(400);
      });
  }
);

router.put(
  "/:userId/:projectId/:listI/list/delList",
  isLoggedIn,
  (req, res) => {
    let newList = req.body;
    Project.findById(req.params.projectId)
      .then((project) => {
        project.cards = newList;
        project.save();
        res.json({ message: "تم حذف القائمة بنجاح" }).status(200);
      })
      .catch((err) => {
        res.json({ message: "حدث خطأ,لا يمكن نقل المهام" }).status(400);
      });
  }
);

router.post("/:userId/:projectId/invite", isLoggedIn, (req, res) => {
  const inviteUser = {
    email: req.body.invite,
    havePermission: req.body.havePermission,
  };
  User.findOne({ email: inviteUser.email })
    .populate({
      path: "projects.project",
      model: "Project",
    })
    .then((user) => {
      if (user) {
        Project.findById(req.params.projectId).then((project) => {
          if (project.users.includes(user._id)) {
            res.json({
              errorMsg: "لا يمكن دعوة مستخدم مسجل في الفريق",
              state: "error",
            });
          } else {
            project.users.push(user._id);
            project.save();
            user.projects.push({
              project: req.params.projectId,
              havePermission: inviteUser.havePermission,
            });
            user.save();
            const msg = {
              to: user.email,
              from: "labdul2ziz@gmail.com",
              subject: "دعوة الى مشروع",
              text: " ",
              html: `تمت دعوتك لمشروع جديد من قبل أحد مدراء المشروع .\n\n
                    الرجاء دخول الموقع لتفَقد المشاريع:\n\n
                    http://localhost:3000/
                    \n\n
                    `,
            };
            sgMail
              .send(msg)
              .then(() =>
                res.json({
                  msg: "تم ارسال بريد إلكتروني , الرجاء تفقُد البريد",
                })
              )
              .catch((err) => res.json({ msg: err }));
            res.json({
              successMsg: "تم دعوة المستخدم بنجاح",
              invitedUserInfo: inviteUser,
              state: "success",
            });
          }
        });
      } else {
        res.json({
          errorMsg: "البريد الإلكتروني غير مسجل بعد",
          state: "error",
        });
      }
    })
    .catch((err) => {});
});

module.exports = router;

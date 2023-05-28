const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

mongoose.connect("mongodb+srv://admin-fahad:test1234@cluster0.sbjnrfj.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String,
    checkedValue: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
    name: "Welcome to your to-do list!",
    checkedValue: "Off"
});

const item2 = new Item({
    name: "Hit the + button to add a new item.",
    checkedValue: "Off"
});

const item3 = new Item({
    name: "Hit this to delete an item.-->",
    checkedValue: "Off"
});

const defaultItems = [item1, item2, item3];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public"));

app.get("/", function(req, res){
    
    const day = date.getDate();

    Item.find({})
        .then(function(items){
           // mongoose.connection.close();
           if(items.length === 0){
                Item.insertMany(defaultItems)
                    .then(function () {
                        console.log("Successfully saved items to todolistDB!");
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
                res.redirect("/");
           } else {
                res.render("list", {listTitle: day, newListItems: items});
           }
        });
});

app.get("/lists/:customListName", function(req, res){

    const customListName = _.capitalize(req.params.customListName);


    List.findOne({name: customListName})
        .then(function(list){
            //mongoose.connection.close();

            if(list){
                //Show an existing list
                res.render("list", {listTitle: list.name, newListItems: list.items});
            } else{
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
            
                list.save();
                res.redirect("/lists/" + customListName);
            }
       
            })

        .catch(function(err){
            console.log(err);
        });
});

app.get("/about", function(req, res){
    res.render("about");
});


app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;
    const day = date.getDate();

    //console.log(listName);

    const item = new Item({
        name: itemName,
        checkedValue: "Off"
    });

    if(listName === day){
        
        item.save();

        res.redirect("/");
    } else {
        List.findOne({name: listName})
        .then(function(list){
        
            list.items.push(item);
            list.save();
            res.redirect("/lists/" + listName);
        
        })

        .catch(function(err){
            console.log(err);
        });
    }
});

app.post("/delete", function(req, res){
    
    const deleteItemId = req.body.deleteIcon;
    const listName = req.body.listName;
    const checkedItemId = req.body.checkedItemId;
    const checkedItemObjectId = new mongoose.Types.ObjectId(checkedItemId);
    const checkboxCurrentStaus = req.body.checkbox;
    const day = date.getDate();

    console.log("hidden value: " + checkedItemId);
    console.log("current status: " + checkboxCurrentStaus);
    //console.log(deleteItemId);
    console.log(checkedItemObjectId);
    
    if(deleteItemId){

        if(listName === day) {
            Item.findByIdAndRemove(deleteItemId)
          .then(function () {
            console.log("Successfully deleted the item from DB!");
          })
          .catch(function (err) {
            console.log(err);
          });
    
            res.redirect("/");
        } else {
            List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deleteItemId}}})
            .then(function () {
                console.log("Successfully deleted the item from " + listName + " list!");
              })
              .catch(function (err) {
                console.log(err);
              });
    
            res.redirect("/lists/" + listName);
        }   

    } else {//this section is used for checkbox========================================================
        if(checkboxCurrentStaus === "Off") {
            if(listName === day) {
                Item.updateOne({_id: checkedItemId}, {checkedValue: "On"})
                .then(function () {
                  console.log("Successfully updated 'checked ON' item list");
                })
                .catch(function (err) {
                  console.log(err);
                });

            res.redirect("/");
            } else {

                // List.listName.findOneAndUpdate({_id: checkedItemId}, {$push: {items: {checkedValue: "On"}}})
                // .then(function () {
                //     console.log("Successfully updated 'checked ON' "+ checkedItemId + " in the " + listName + " list!");
                // })
                // .catch(function (err) {
                //     console.log(err);
                // });

                // List.findOneAndUpdate({
                //     name: listName
                //   },
                //   {
                //     $set: {
                //       "items.$[i].checkedValue": "On"
                //     }
                //   },
                //   {
                //     arrayFilters: [
                //       {
                //         "i._id": checkedItemId
                //       }
                //     ]
                //   });

                // List.findOneAndUpdate({name: listName, _id: checkedItemId}, {$set: {items: {checkedValue: "On"}}}, {
                //   returnOriginal: false
                // })
                // .then(function () {
                //     console.log("Successfully deleted the item from " + listName + " list!");
                //   })
                //   .catch(function (err) {
                //     console.log(err);
                //   });

                //==============26 May 2023 11:18 AM====================
                List.collection.updateOne(  
                    { 'items.checkedValue': 'Off', 'name': {'$eq': listName}},
                    { '$set': { 'items.$[element].checkedValue': 'On' } },
                    {
                      arrayFilters: [
                        {
                          'element._id': { '$eq': checkedItemObjectId }
                        }
                      ]
                    })
                
            res.redirect("/lists/" + listName);
            }
        } else {
            if(listName === day) {
                Item.updateOne({_id: checkedItemId}, {checkedValue: "Off"})
                .then(function () {
                  console.log("Successfully updated 'checked OFF' item list");
                })
                .catch(function (err) {
                  console.log(err);
                });
            res.redirect("/");
            } else {
                // List.listName.findOneAndUpdate({_id: checkedItemId}, {$push: {items: {checkedValue: "Off"}}})
                // .then(function () {
                //     console.log("Successfully updated 'checked ON' "+ checkedItemId + " in the " + listName + " list!");
                // })
                // .catch(function (err) {
                //     console.log(err);
                // });

                // List.findOneAndUpdate({
                //     name: listName
                //   },
                //   {
                //     $set: {
                //       "items.$[i].checkedValue": "Off"
                //     }
                //   },
                //   {
                //     arrayFilters: [
                //       {
                //         "i._id": checkedItemId
                //       }
                //     ]
                //   });

                // List.findOneAndUpdate({name: listName, _id: checkedItemId}, {$set: {items: {checkedValue: "Off"}}}, {
                //   returnOriginal: false
                // })
                // .then(function () {
                //     console.log("Successfully deleted the item from " + listName + " list!");
                //   })
                //   .catch(function (err) {
                //     console.log(err);
                //   });

                //====================26 May 2023 11:20AM=====================
                List.collection.updateOne(  
                    { 'items.checkedValue': 'On' , 'name': {'$eq': listName}},
                    { '$set': { 'items.$[element].checkedValue': 'Off' } },
                    {
                      arrayFilters: [
                        {
                          'element._id': { '$eq': checkedItemObjectId }
                        }
                      ]
                    })

            res.redirect("/lists/" + listName);
            }
        }
    }

});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server started on port 3000.");
});
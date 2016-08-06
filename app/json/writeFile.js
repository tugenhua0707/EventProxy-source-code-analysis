var fs = require('fs');

var myData = {
  "name": 'kongzhi1',
  "age": 12
};

var myData2 = {
  "name": 'kongzhi2',
  "age": 23
};
fs.writeFile('./json1.json',JSON.stringify(myData),function(err){
  if(err) {
      console.log(err);
    } 
});

fs.writeFile('./json2.json',JSON.stringify(myData2),function(err){
  if(err) {
      console.log(err);
    } 
});
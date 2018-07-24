var socket = io('http://maproom.lmc.gatech.edu:8080/');

function normalize(data) {
  var result = [];
  count = 0
  for (var row in data) {
      var address = data[row].properties["SITUS"];
      var tenAssess = data[row].properties["2010_assessment"];
      var sevenAssess = data[row].properties["2017_assessment"];
      var changeAssess = data[row].properties["assess_change"];
      var tenAppr = data[row].properties["2010_appr"];
      var sevenAppr = data[row].properties["2017_appr"];
      var changeAppr = data[row].properties["appr_change"];
      var ID = data[row].properties["ID"];

      result.push([ID, address, tenAssess, sevenAssess, changeAssess, tenAppr, sevenAppr, changeAppr]);
  }
  return result;
};


socket.on('updateTable', function(data) {
  console.log("updating table");
  console.log(data);
  console.log(normalize(data.features));
  $("table").DataTable().destroy();
  var datatable = $("table").DataTable({
      //removed data.features, use in
      "aaData":normalize(data),
      "aoColums":[
          {title: "ID", data: "ID"},
          {title: "Address", data: "SITUS"},
          {title: "2010 Assessment", data: "2010_assessment"},
          {title: "2017 Assessment", data: "2017_assessment"},
          {title: "Assessment Change", data: "assess_change"},
          {title: "2010 Appraisal", data: "2010_appr"},
          {title: "2017 Appraisal", data: "2017_appr"},
          {title: "Appraisal Change", data: "appr_change"},
      ],
      "info":false,
      "lengthChange": false,
      "paging": false,
      "order":[],
  });
});


$(document).ready( function () {
  $('table').DataTable({
      "info":false,
      "lengthChange": false,
      "paging": false,
      "display": true,
});

var currClick = -1;
  $('table tbody').on( 'click', 'tr', function () {
    var tab = $('table').DataTable();
    if ($(this).hasClass('selected')){
      $(this).removeClass('selected');
        socket.emit("removeMarker", {'removeMarker':tab.row(this).index()});
      currClick = -1;
      console.log("resetting currClick");
    }
    else{
        if (currClick > -1){
            console.log(currClick);
            socket.emit("removeMarker", {'removeMarker':currClick});
        };
        //need to remove from selected class
        tab.$('tr.selected').removeClass('selected');
        currClick = tab.row(this).index();
        console.log(currClick);
        $(this).addClass('selected');
        socket.emit("newMarker", {'newMarker':tab.row(this).index()});
    }
});
});

var socket = io('http://maproom.lmc.gatech.edu:8080/');

/* Resetting table with currently avaliable points
*/
socket.on('displayTableData', function(data) {
    console.log("updating table");
    console.log(data);
    //Refresh by clearing table
    $("table").DataTable().destroy();
    var datatable = $("table").DataTable({
        //Data is already in array
        "aaData":data,
        "aoColums":[
            {title: "ID"},
            {title: "ParcelID"},
            {title: "Address"},
            {title: "Assessment % Change"},
            {title: "Appraisal % Change"},
            {title: "OBJECTID"},
            {title: "TaxYear"},
            {title: "Address"},
            {title: "AddrNumber"},
            {title: "AddrPreDir"},
            {title: "AddrStreet"},
            {title: "AddrSuffix"},
            {title: "AddrPosDir"},
            {title: "AddrUntTyp"},
            {title: "AddrUnit"},
            {title: "Owner"},
            {title: "OwnerAddr1"},
            {title: "OwnerAddr2"},
            {title: "TaxDist"},
            {title: "TotAssess"},
            {title: "LandAssess"},
            {title: "ImprAssess"},
            {title: "TotAppr"},
            {title: "LandAppr"},
            {title: "ImprAppr"},
            {title: "LUCode"},
            {title: "ClassCode"},
            {title: "ExCode"},
            {title: "LivUnits"},
            {title: "LandAcres"},
            {title: "NbrHood"},
            {title: "Subdiv"},
            {title: "SubdivNum"},
            {title: "SubdivLot"},
            {title: "SubdivBlck"},
            {title: "FeatureID"},
            {title: "SHAPESTArea"},
            {title: "SHAPESTLength"},
            {title: "OBJECTID"},
            {title: "DIGEST"},
            {title: "SITUS"},
            {title: "TAXPIN"},
            {title: "ATRPIN"},
            {title: "TAX_DISTR"},
            {title: "OWNER1"},
            {title: "OWNER2"},
            {title: "ADD2"},
            {title: "ADD3"},
            {title: "ADD4"},
            {title: "ADD5"},
            {title: "LUC"},
            {title: "NBHD"},
            {title: "PROP_CLASS"},
            {title: "CLASS"},
            {title: "TOT_APPR"},
            {title: "TOT_ASSESS"},
            {title: "IMPR_APPR"},
            {title: "LAND_APPR"},
            {title: "FUL_EX_COD"},
            {title: "VAL_ACRES"},
            {title: "STRUCT_FLR"},
            {title: "STRUCT_YR"},
            {title: "TIEBACK"},
            {title: "TAXYEAR"},
            {title: "STATUS_COD"},
            {title: "LIV_UNITS"},
            {title: "PCODE"},
            {title: "UNIT_NUM"},
            {title: "GID"},
            {title: "EXTVER"},
            {title: "ShapeSTArea"},
            {title: "ShapeSTLength"}
        ],
        //display options
        "info":false,
        "lengthChange": false,
        "paging": false,
        "order":[],
    });
  });

/* Initializes Datatables jQuery plugin - sets options
*/
  $(document).ready( function () {
    $('table').DataTable({
        "info":false,
        "lengthChange": false,
        "paging": false,
        "display": true,
  });

document.getElementById('refreshTable').addEventListener('click', function(){
  socket.emit('refreshTable');
});

/* Sets current highlighted point, chosen by user
*/
  var currClick = -1;
    $('table tbody').on( 'click', 'tr', function () {
      var tab = $('table').DataTable();
      //if already selected, remove highlight
      if ($(this).hasClass('selected')){
        $(this).removeClass('selected');
          //removes highlight from projector view
          socket.emit("removeMarker", {'removeMarker':tab.row(this).data()[0]});
        currClick = -1;
      }
      else{
          //if another point is current selected, remove that point's highlight
          if (currClick > -1){
              socket.emit("removeMarker", {'removeMarker':tab.row(currClick).data()[0]});
          };
          tab.$('tr.selected').removeClass('selected');
          currClick = tab.row(this).index();
          $(this).addClass('selected');
          //highlight current selection
          socket.emit("newMarker", {'newMarker':tab.row(this).data(), 'index':tab.row(this).index()});
      }
  });
  });

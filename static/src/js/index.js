var gpsmap_section;
var device_active;

var gMEvent;    
var geocoder;
var vehicle_data			=new Array();
var labels					=new Array();
var localizaciones			=new Array();
var localizacion_anterior;

odoo.define('gpsmap', function (require) {
    "use strict";
    var AbstractAction  = require('web.AbstractAction');
    var core            = require('web.core');
    var session         = require('web.session');
    var Widget          = require('web.Widget');
    var rpc             = require('web.rpc'); 
            
    var local                   ={};
    //var map;
    
    var class_gpsmap = AbstractAction.extend({
        template: 'gpsmaps_maponline',
       
        willStart: function () {
            this.map;
            console.log("class_gpsmap.willStart");
            var self = this;            
            var data={
                model: 'tc_geofences',
                method: 'search_read',
                context: session.user_context,
            }
            data["model"]="fleet.vehicle";            
            var def= this._rpc(data)
            .then(function(res) 
            {
                self.vehicles     =res;                        
                local.vehicles     =res;                                        
            });        
            return Promise.all([def, this._super.apply(this, arguments)]);                
        },
        //////////////////////////////////////////////////////////////
        events: {
            'click div.vehicle': function (e) {                
                this.$("div.vehicle").click(function(){                    
                    $("div.vehicle").removeClass("vehicle_active");                
                    $(this).addClass("vehicle_active");
                    device_active               =$(this).attr("vehicle");                
                    gpsmaps_obj.status_device(this);
                });
            },
        },                
        //////////////////////////////////////////////////////////////
		vehicles_menu: function(type)  
		{
		    console.log("class_gpsmap.vehicles_menu");
            setTimeout(function()
            {
                render_gps( $("td#menu_vehicle"), $("div#menu_vehicle"), -25);    
                 
		        var vehiculos       =local.vehicles;
		        var menu_vehiculo   ="";
		        var opcion_vehiculo ="";
		        var ivehiculos;
		        var icon;
		        var tipo;
		        		        
		        if(vehiculos!= null && vehiculos.length>0)
		        {		            
		            //console.log("Crea menu de vehiculos con la variable");
var i=0;		            
do {
  i = i + 1;
  
  
		            for(ivehiculos in vehiculos)
		            {		 		                               
		                var vehiculo        =vehiculos[ivehiculos];		                
		                
                        if(vehiculo["gps1_id"]!=undefined )
                        {          
                            var vehiculo_id     =vehiculo["gps1_id"][0];
                        }
                        var vehiculo_name   =vehiculo["name"].split("/");
                        vehiculo_name       =vehiculo_name[0];
                        
                        if(!(vehiculo["economic_number"]==undefined || vehiculo["economic_number"]==false))
                        {
                            vehiculo_name   = vehiculo["economic_number"];
                        }                        
                                                                            
			            var image="01";
			            if(!(vehiculo["image_vehicle"]==undefined || vehiculo["image_vehicle"]==false))
			            {
			                image=vehiculo["image_vehicle"];
			            }			
			            icon="/gpsmap/static/src/img/vehiculo_" +image+ "/i135.png";

		                opcion_vehiculo =opcion_vehiculo+"\
		                    <div class=\"vehicle\" position=\"\" latitude=\"\" longitude=\"\" device_id=\""+vehiculo_id+"\" vehicle=\""+vehiculo_id+"\" style=\"float:left; width:200px: display: block;\">\
    		                    <table height=\"31\" width=\"195\" border=\"0\"  style=\"padding:5px;\" >\
		                        <tr>\
		                            <td height=\"100%\" width=\"40\" align=\"center\" valign=\"center\">\
		                                <img height=\"18\" src=\"" +icon+ "\">\
	                                </td>\
		                            <td  height=\"100%\"><div style=\"position:relative; width:100%; height:100%;\">\
    		                            <div style=\"   position:absolute; top:1px; left:0px; font-size:15px;\">" + vehiculo_name + "</div>\
	    	                            <div style=\"position:absolute; top:16px; left:0px; font-size:9px;\"><b>"+ vehiculo["license_plate"] +"</b></div></td>\
		                            <td height=\"100%\" width=\"30\" align=\"center\" class=\"event_device\"> </td>\
	                            </tr>\
	                            </table>\
                            </div>\
                        ";

		            }

} while (i < 5);
                
		            $("div#menu_vehicle").append(opcion_vehiculo);  
		        }
		        else 
		        {
    		        gpsmaps_obj.vehicles_menu();
		        }    
            },50);
		},
        //////////////////////////////////////////////////////////////
        CreateMap:function(iZoom,iMap,coordinates,object) 
        {
            console.log("class_gpsmap.CreateMap");
	        setTimeout(function()
	        {  
	            if(google!=null)
	            {      
			        if(iMap=="ROADMAP")	            	var tMap = google.maps.MapTypeId.ROADMAP;
			        if(iMap=="HYBRID")	            	var tMap = google.maps.MapTypeId.HYBRID;								
			        var directionsService;	
			        
			        var position		            	=LatLng(coordinates);
			        var mapOptions 		            	= new Object();
	        
			        if(iZoom!="")		            	mapOptions.zoom			=iZoom;
			        if(position!="")	            	mapOptions.center		=position;
			        if(iMap!="")		            	mapOptions.mapTypeId	=tMap;	            
			        
			        mapOptions.ScaleControlOptions		={position: google.maps.ControlPosition.TOP_RIGHT}
			        mapOptions.RotateControlOptions		={position: google.maps.ControlPosition.TOP_RIGHT}
			        mapOptions.zoomControlOptions		={position: google.maps.ControlPosition.TOP_LEFT};
			        mapOptions.streetViewControlOptions	={position: google.maps.ControlPosition.TOP_RIGHT}
			        				      
			        gpsmaps_obj.map    				    = new google.maps.Map(document.getElementById(object), mapOptions);        
			        geocoder 		   					= new google.maps.Geocoder();      
			        var trafficLayer 					= new google.maps.TrafficLayer();						
          			trafficLayer.setMap(gpsmaps_obj.map);
          					    
			        gMEvent                         	= google.maps.event;			        			        			        
		        }
		        else return gpsmaps_obj.CreateMap(iZoom,iMap,coordinates,object);	   
	        },50);
        },
        //////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////
        map: function(object) {
            console.log("class_gpsmap.map");
            if(object==undefined)   object="maponline";
	        var iZoom               =3;
	        var iMap                ="HYBRID";  //ROADMAP
	        var coordinates         ={latitude:19.057522756727606,longitude:-104.29785901920393};
            gpsmaps_obj.CreateMap(iZoom,iMap,coordinates,object);                                   
        },
        //////////////////////////////////////////////////////////////
        positions_paint:function(argument)
        {       
        
            console.log("class_gpsmap.positions_paint");
            var ipositions;
            var iposition;
            if(local.positions.length>0)
            {                  
                //console.log("POSITIONS PAINT ========");
                var vehiculo_id;
                var vehiculos       =local.vehicles;
                var ivehiculos;
                for(ipositions in local.positions)
                {	
                    var positions       =local.positions[ipositions];
                    for(iposition in positions)
                    {	
                        var position       =positions[iposition];                    
                        var device_id       =position.de; 
	                    if(vehiculos!= null && vehiculos.length>0)
	                    {	                    
	                        for(ivehiculos in vehiculos)
	                        {		                
	                            var vehiculo        =vehiculos[ivehiculos];		                
	                            
	                            if(vehiculo["gps1_id"][0]==device_id)
	                            {		                        
                                    var vehiculo_name   =vehiculo["economic_number"];
                                    var vehiculo_img    =vehiculo["image_vehicle"];

                                    var coordinates		={"latitude":position.latitude,"longitude":position.longitude};
                                    var posicion 		=LatLng(coordinates);
                                    coordinates["ti"]   =position.devicetime;
                                    coordinates["sp"]   =position.speed_compu;
                                    
                                    if($(".vehicle[vehicle='"+device_id+"'] ").length>0)                        
                                        $(".vehicle[vehicle='"+device_id+"']").attr(coordinates);
                                        
                                    vehiculo["de"]=device_id;
                                    vehiculo["dn"]=vehiculo_name;
                                    vehiculo["te"]=position.phone;
                                    vehiculo["la"]=position.latitude;
                                    vehiculo["lo"]=position.longitude;
                                    vehiculo["co"]=position.course;
                                    vehiculo["sp"]=position.speed_compu;
                                    vehiculo["ty"]=position.status;
//                                    vehiculo["mi"]=position.odometro;
                                    vehiculo["ev"]=position.event;
                                    vehiculo["ti"]=position.devicetime;
                                    vehiculo["im"]=vehiculo_img;
                                    vehiculo["at"]=position.attributes;
                                    
	                                gpsmaps_obj.locationsMap(vehiculo);            
	                                //if(device_active==device_id) execute_streetMap(vehiculo);
                                }    
                            }
                        }
                    }                    
                }
            }
        },

        //////////////////////////////////////////////////////////////

        positions_search:function(argument){
            console.log("class_gpsmap.positions_search");
            var fields_select   =['deviceid','devicetime','latitude','longitude','speed_compu','attributes','address','event','status','course','phone'];
            var vehiculo_id;
            var vehiculos       =local.vehicles;
            var iresult;
            var method;
            var time;
            var ivehiculos;
            var model;
                        
            if(gpsmap_section=="gpsmaps_maphistory")
            {
                var start_time  =$("input#start").val();
                var end_time    =$("input#end").val();
                var filter    =$("li[class='type_report select']").attr("filter");
                                
                var option_args={
                    "domain":Array(),
                };

                option_args["domain"].push(["devicetime",">",start_time]);
                option_args["domain"].push(["devicetime","<",end_time]);                
                option_args["domain"].push(["type_report",">",filter]);

                //if(device_active!=0)                
                    option_args["domain"].push(["deviceid","=",device_active]);

                model={   
                    model:  "fleet.vehicle",
                    method: "positions",
                    args:[[],{"data":option_args,"fields": fields_select}],
                };                  

            }
            else
            {   
                model={   
                    model:  "fleet.vehicle",
                    method: "js_vehicles",
                    fields: fields_select
                };                
            }
            
            setTimeout(function()
            {
                if(vehiculos!= null && vehiculos.length>0)
                {	            
                    rpc.query(model)
                    .then(function (result) 
                    {
                        del_locations();
                        local.positions=Array();                          
                        {       
                            
                            console.log(result);                     	            
                            for(iresult in result)
                            {                            
                                
                                var positions               =result[iresult];                                

                                var device                  =positions.deviceid;		                
                                var device_id               =positions["deviceid"];
            
                                if(typeof device_id!="number")
                                    var device_id           =positions["deviceid"][0];
                                    
                                if(local.positions[device_id]==undefined)
                                {
                                    local.positions[device_id]=Array();
                                }                                
                                
                                

                                positions.mo                ="";
                                positions.st                =1;
                                positions.te                =positions["phone"];
                                ////positions.dn                =vehiculo_name;
                                positions.ty                =positions["status"];
                                positions.na                ="name";
                                positions.de                =device_id;
                                positions.la                =positions["latitude"];
                                positions.lo                =positions["longitude"]; 
                                positions.co                =positions["course"]; 
                                //positions.mi                ="milage 2"; 
                                positions.sp                =positions["speed_compu"]; 
                                positions.ba                ="batery"; 
                                positions.ti                =positions["devicetime"]; 

                                positions.ho                ="icon_online"; 
                                positions.ad                =positions["address"]; 
                                positions.at                =positions["attributes"]; 
                                positions.im                =positions["image_vehicle"];     
                                positions.ev                =positions["event"]; 
                                positions.ge                ="geofence";
                                positions.ge                ="";  
                                positions.ni                ="nivel";
                                                
                                if(gpsmap_section=="gpsmaps_maphistory")        local.positions[device_id].push(positions);
                                else                                            local.positions[device_id][0]=positions;
                            }                                    
                        }
                        gpsmaps_obj.positions_paint(argument);                                                              
                    });
                }
            },50);
            
        },

      status_device: function(obj)
    {	    	
        if(device_active==undefined)    device_active	=0;        
        
        if(obj!=undefined)
        {	            
            var latitude                =$(obj).attr("latitude");
            var longitude               =$(obj).attr("longitude");
            var ti                      =$(obj).attr("ti");
            var sp                      =$(obj).attr("sp");

            if(latitude!=undefined)
            {
                console.log("Pinta coordenadas");
                var coordinates             ={"latitude":latitude,"longitude":longitude};
                var position                = LatLng(coordinates);
                gpsmaps_obj.map.panTo(position);
            }
        } 
           
		if(device_active==0)	
		{		 
		    if($("div#odometro").length>0)
		    {   
			    $("div#map_search").show();
			    $("div#odometro").hide();
			    $("div#tableros").hide();
			    $("#tablero").html("Estatus : Seleccionar un vehiculo");			
			    $("#tablero").animate({				
				    height: 25
			    }, 1000 );			
		    }
		}	
		else
		{
			gpsmaps_obj.map.setZoom(16);
            if($("div#odometro").length>0)
            {
                $("div#maponline2").hide();
			    $("#tablero").animate({				
				    height: 58
			    }, 1000 );
			    //$("#tablero").html("<h4>" + ti + " Loading...</h4><img id=\"loader1\" src=\"icon=\"/gpsmap/static/src/img/loader1.gif\" height=\"20\" width=\"20\"/>");
			    $("#odometro").show();
			    $("#tableros").show();  
			    $("div#map_search").hide();
	        }
		}	  			
	},
      
        //////////////////////////////////////////////////////////////
        destroy: function() {
            $(window).off("message.apps");
            if (this.$ifr) {
                this.$ifr.remove();
                this.$ifr = null;
            }
            return this._super();
        },

        position: function(argument) {
            console.log("POSITION ========");
            setTimeout(function()
            {  
                if(argument==undefined)                 gpsmaps_obj.positions(argument);
                else if($("#data_tablero").length==0)   
                {
                    console.log("tablero");
                    gpsmaps_obj.position(argument);         
                }    
            },100);
        },
        ////////////////////////////////////////////////////////////
        positions: function(argument) {
            var time=1000;  	    

            if(gpsmap_section!="gpsmaps_maphistory" && $("div#maponline").length>0)
            { 
                console.log("POSITIONS ====== lalo =");
                time=15000;        
                gpsmaps_obj.positions_search(argument);         
            }
            if(typeof argument!="number")
            {
                setTimeout(function()
                {            
                    gpsmaps_obj.positions(argument);
                },time);
            }
        },    


	 locationsMap: function(vehicle, type)
	{
	    console.log("function locationsMap");
		if(type==undefined)     type="icon";
		else                    type="marker";

		if(vehicle["st"]==undefined)	vehicle["st"]="1";
		if(vehicle["st"]=="")			vehicle["st"]="1"; 
		if(vehicle["mo"]=="map")		vehicle["st"]="1";
		
		//alert(vehicle["mo"]);
	    //alert(vehicle["st"]);		
		if(vehicle["st"]=="1" || vehicle["st"]=="-1")
		{
			var device_id=vehicle["de"];
			
			if(localizacion_anterior==undefined)	
			{
				localizacion_anterior=new Array();				
				localizacion_anterior[device_id]={ti:"2000-01-01 00:00:01"}			
			}
			if(localizacion_anterior[device_id]==undefined)	
			{
				localizacion_anterior[device_id]={ti:"2000-01-01 00:00:01"}			
			}									
			//if(vehicle["se"]=="historyMap" || vehicle["se"]=="historyForm" || vehicle["ti"] >= localizacion_anterior[device_id]["ti"])
			//if(vehicle["se"]=="historyForm" || vehicle["ti"] >= localizacion_anterior[device_id]["ti"])
			if(vehicle["ti"] >= localizacion_anterior[device_id]["ti"])
			{
			    //alert("1");
				//if(vehicle["ti"] > localizacion_anterior[device_id]["ti"] && vehicle["se"]!="simulator")
				//hablar(vehicle);
				localizacion_anterior[device_id]=vehicle;
			
				var coordinates			={latitude:vehicle["la"],longitude:vehicle["lo"]};
	
				$("table.select_devices[device="+ vehicle["de"] +"]")
					.attr("lat", vehicle["la"])
					.attr("lon", vehicle["lo"]);
					
				var icon_status="";	
				if(vehicle["ty"]=="alarm")				                icon_status="sirena.png";
				if(vehicle["ty"]=="Stopped")		                    icon_status="stop.png";
				if(vehicle["ty"]=="Moving")		                        icon_status="car_signal1.png";
				if(vehicle["ty"]=="Online")		                        icon_status="car_signal1.png";
				if(vehicle["ty"]=="Offline")		
				{
				    
					icon_status="car_signal0.png";
					if(vehicle["ho"]==1)	                            icon_status="car_signal1.png";
				}	
				if(vehicle["ty"]=="ignitionOn")			                icon_status="swich_on.png";
				if(vehicle["ty"]=="ignitionOff")		                icon_status="swich_off.png";
				
				if(vehicle["sp"]<5 && vehicle["ty"]=="Online")	        icon_status="stop.png";
				if(vehicle["sp"]>5 && vehicle["ty"]=="Online")	        icon_status="car_signal1.png";
				
				if(icon_status!="")
				{				    
					var img_icon="<img width=\"20\" title=\""+ vehicle["ev"] +"\" src=\"/gpsmap/static/src/img/"+ icon_status +"\" >";					
				    if(vehicle["ty"]=="Offline")		
				    {
				        img_icon="<a href=\"tel:" + vehicle["te"] +"\">"+img_icon +"</a>";				        
				    }											
					$("table.select_devices[device_id="+ vehicle["de"] +"] tr td.event_device").html(img_icon);
				}	
							
				var icon        		=undefined;
				
				var posicion 		    = LatLng(coordinates);						    	
				if(type=="icon")
				{				    
					var marcador;
					if(vehicle["co"]==undefined)        vehicle["co"]	=1;
					if(vehicle["co"])                   icon    		=vehicle["co"];
					
					if(icon>22 && icon<67)	icon=45;
					else if(icon<112)		icon=90;
					else if(icon<157)		icon=135;
					else if(icon<202)		icon=180;
					else if(icon<247)		icon=225;
					else if(icon<292)		icon=270;
					else if(icon<337)		icon=315;
					else					icon=0;		

					var image="01";
					if(!(vehicle["im"]==undefined || vehicle["im"]==false))		image	=vehicle["im"];

					//icon	="../sitio_web/img/car/vehiculo_" +image+ "/i"+icon+ ".png";		    
					icon="/gpsmap/static/src/img/vehiculo_" +image+ "/i"+icon+ ".png";		    
					if(labels[device_id]==undefined)	
					{

						labels[device_id]=new MapLabel({
							text: 			vehicle["dn"],
							position: 		posicion,
							map: 			gpsmaps_obj.map,
							fontSize: 		14,
							fontColor:		"#8B0000",
							align: 			"center",
							strokeWeight:	5,
						});
						
					}
					//alert("2");
					labels[device_id].set('position', posicion);
			
					//if(device_active==vehicle["de"] && vehicle["se"]==undefined || vehicle["se"]=="simulator" || vehicle["se"]=="historyForm") 
					if(device_active==vehicle["de"] && vehicle["se"]==undefined || vehicle["se"]=="simulator")
					{
					    // SI PASA EN EL HISTORICO
					    //alert("PASA 3");
					    gpsmaps_obj.centerMap(posicion);			
					    odometro(vehicle);
					} 
				}				
				var marcador 		    = gpsmaps_obj.markerMap(posicion, icon);		
				var infowindow 		    = messageMap(marcador, vehicle);
				
				fn_localizaciones(marcador, vehicle);
			}
			else
			{
				//alert(vehicle["ti"] + ">"+ localizacion_anterior[device_id]["ti"]);
			}					
		}
		else 
		{
			var marcador 		    =undefined;
			
			var tablero="<table><tr><td style=\"color:red;\"><b>Los vehiculos se encuentran bloqueados</b></td></tr><tr><td style=\"color:#fff;\">Favor de contactar con el administrador del sistema</td></tr></table>";	
    	    $("#tablero").html(tablero);			
		}
		return marcador;
	},

	markerMap: function(position, icon, markerOptions) 
	{
        console.log("function markerMap");	
		if(markerOptions==undefined)	var markerOptions 			= new Object();
				
		markerOptions.position		=position;
		markerOptions.map			=gpsmaps_obj.map;
		if(icon!=undefined)
			markerOptions.icon		=icon;
				
		console.log("function markerMap" + gpsmaps_obj.map);	
		var marker2=new google.maps.Marker(markerOptions);
 		return marker2
	},

    centerMap: function(marcador)
	{
		gpsmaps_obj.map.panTo(marcador);		
	},

        
        ////////////////////////////////////////////////////////////
        positions_online: function() {
            console.log("class_gpsmap.positions_online");
            if(local.vehicles==undefined)       local.vehicles  =Array();            
            if(local.geofences==undefined)      local.geofences =Array();
            local.positions =undefined;    

            gpsmaps_obj.vehicles_menu(gpsmap_section);               
            gpsmaps_obj.map();            


            if(gpsmap_section!="gpsmaps_maphistory")
            {
                gpsmaps_obj.status_device();
                gpsmaps_obj.positions_search();
                gpsmaps_obj.status_device($(".vehicle_active"));
/*
                gpsmaps_obj.geofences_paint();
                gpsmaps_obj.route_paint();
                
                
*/
                gpsmaps_obj.position();
    
                setTimeout(function()    {
                    $("div#filtro").hide();
                    $("div#tableros").hide();
                    $("div#odometro").hide();
                    $("div#buttons_history").hide();
                },100);    

            }                
            else  
            {                
                setTimeout(function()    {
                    this.$("div#filtro").show();    
                    this.$(".event_device").html("");                    
                },100);
            }

        },    
        
        
    });    
    

    //////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
    
    
    local.maponline = class_gpsmap.extend({
        template: 'gpsmaps_maponline',
        start: function() {                  
            gpsmap_section="gpsmaps_maponline"; 
            gpsmaps_obj.positions_online();
        },
    });
    core.action_registry.add('gpsmap.maponline',local.maponline);
    var gpsmaps_obj         =new class_gpsmap();    


    return local.maponline;
});

  

	function LatLng(co)  
	{
		return new google.maps.LatLng(co.latitude,co.longitude);
	} 

    function render_gps(origen, destino,diferencia)
    {			
	    destino.height(1);
	    var alto  =origen.height() + parseFloat(diferencia);
	    destino.height(alto);	   
    }
/*
    function status_device(obj)
    {	    	
        if(device_active==undefined)    device_active	=0;        
        
        if(obj!=undefined)
        {	            
            var latitude                =$(obj).attr("latitude");
            var longitude               =$(obj).attr("longitude");
            var ti                      =$(obj).attr("ti");
            var sp                      =$(obj).attr("sp");

            if(latitude!=undefined)
            {
                console.log("Pinta coordenadas");
                var coordinates             ={"latitude":latitude,"longitude":longitude};
                var position                = LatLng(coordinates);
                map.panTo(position);
            }
        } 
           
		if(device_active==0)	
		{		 
		    if($("div#odometro").length>0)
		    {   
			    $("div#map_search").show();
			    $("div#odometro").hide();
			    $("div#tableros").hide();
			    $("#tablero").html("Estatus : Seleccionar un vehiculo");			
			    $("#tablero").animate({				
				    height: 25
			    }, 1000 );			
		    }
		}	
		else
		{
			map.setZoom(16);
            if($("div#odometro").length>0)
            {
                $("div#maponline2").hide();
			    $("#tablero").animate({				
				    height: 58
			    }, 1000 );
			    //$("#tablero").html("<h4>" + ti + " Loading...</h4><img id=\"loader1\" src=\"icon=\"/gpsmap/static/src/img/loader1.gif\" height=\"20\" width=\"20\"/>");
			    $("#odometro").show();
			    $("#tableros").show();  
			    $("div#map_search").hide();
	        }
		}	  			
	}
*/
	function del_locations()  
	{			    
        if(localizaciones.length>0)                
        {
            for(idvehicle in localizaciones)
            {
                //if(simulation_action=="play")                               
                    var positions_vehicle			= localizaciones[idvehicle];                    
                if(positions_vehicle.length>0)                
                {
                    for(iposiciones in positions_vehicle)
                    {  
                        //if(iposiciones>0)
                        {	
                        	localizaciones[idvehicle][iposiciones].setVisible(false);								
                    		localizaciones[idvehicle][iposiciones].setMap(null);                     
                        	//if(iposiciones>0)	                        	localizaciones[idvehicle]=[]; 
                        } 	                    
                    }                    
                }
            }
        }
	}
    /*
	function locationsMap(vehicle, type)
	{
	    console.log("function locationsMap");
		if(type==undefined)     type="icon";
		else                    type="marker";

		if(vehicle["st"]==undefined)	vehicle["st"]="1";
		if(vehicle["st"]=="")			vehicle["st"]="1"; 
		if(vehicle["mo"]=="map")		vehicle["st"]="1";
		
		//alert(vehicle["mo"]);
	    //alert(vehicle["st"]);		
		if(vehicle["st"]=="1" || vehicle["st"]=="-1")
		{
			var device_id=vehicle["de"];
			
			if(localizacion_anterior==undefined)	
			{
				localizacion_anterior=new Array();				
				localizacion_anterior[device_id]={ti:"2000-01-01 00:00:01"}			
			}
			if(localizacion_anterior[device_id]==undefined)	
			{
				localizacion_anterior[device_id]={ti:"2000-01-01 00:00:01"}			
			}									
			//if(vehicle["se"]=="historyMap" || vehicle["se"]=="historyForm" || vehicle["ti"] >= localizacion_anterior[device_id]["ti"])
			//if(vehicle["se"]=="historyForm" || vehicle["ti"] >= localizacion_anterior[device_id]["ti"])
			if(vehicle["ti"] >= localizacion_anterior[device_id]["ti"])
			{
			    //alert("1");
				//if(vehicle["ti"] > localizacion_anterior[device_id]["ti"] && vehicle["se"]!="simulator")
				//hablar(vehicle);
				localizacion_anterior[device_id]=vehicle;
			
				var coordinates			={latitude:vehicle["la"],longitude:vehicle["lo"]};
	
				$("table.select_devices[device="+ vehicle["de"] +"]")
					.attr("lat", vehicle["la"])
					.attr("lon", vehicle["lo"]);
					
				var icon_status="";	
				if(vehicle["ty"]=="alarm")				                icon_status="sirena.png";
				if(vehicle["ty"]=="Stopped")		                    icon_status="stop.png";
				if(vehicle["ty"]=="Moving")		                        icon_status="car_signal1.png";
				if(vehicle["ty"]=="Online")		                        icon_status="car_signal1.png";
				if(vehicle["ty"]=="Offline")		
				{
				    
					icon_status="car_signal0.png";
					if(vehicle["ho"]==1)	                            icon_status="car_signal1.png";
				}	
				if(vehicle["ty"]=="ignitionOn")			                icon_status="swich_on.png";
				if(vehicle["ty"]=="ignitionOff")		                icon_status="swich_off.png";
				
				if(vehicle["sp"]<5 && vehicle["ty"]=="Online")	        icon_status="stop.png";
				if(vehicle["sp"]>5 && vehicle["ty"]=="Online")	        icon_status="car_signal1.png";
				
				if(icon_status!="")
				{				    
					img_icon="<img width=\"20\" title=\""+ vehicle["ev"] +"\" src=\"/gpsmap/static/src/img/"+ icon_status +"\" >";					
				    if(vehicle["ty"]=="Offline")		
				    {
				        img_icon="<a href=\"tel:" + vehicle["te"] +"\">"+img_icon +"</a>";				        
				    }											
					$("table.select_devices[device_id="+ vehicle["de"] +"] tr td.event_device").html(img_icon);
				}	
							
				var icon        		=undefined;
				
				var posicion 		    = LatLng(coordinates);						    	
				if(type=="icon")
				{				    
					var marcador;
					if(vehicle["co"]==undefined)        vehicle["co"]	=1;
					if(vehicle["co"])                   icon    		=vehicle["co"];
					
					if(icon>22 && icon<67)	icon=45;
					else if(icon<112)		icon=90;
					else if(icon<157)		icon=135;
					else if(icon<202)		icon=180;
					else if(icon<247)		icon=225;
					else if(icon<292)		icon=270;
					else if(icon<337)		icon=315;
					else					icon=0;		

					var image="01";
					if(!(vehicle["im"]==undefined || vehicle["im"]==false))		image	=vehicle["im"];

					//icon	="../sitio_web/img/car/vehiculo_" +image+ "/i"+icon+ ".png";		    
					icon="/gpsmap/static/src/img/vehiculo_" +image+ "/i"+icon+ ".png";		    
					if(labels[device_id]==undefined)	
					{

						labels[device_id]=new MapLabel({
							text: 			vehicle["dn"],
							position: 		posicion,
							map: 			map,
							fontSize: 		14,
							fontColor:		"#8B0000",
							align: 			"center",
							strokeWeight:	5,
						});
						
					}
					//alert("2");
					labels[device_id].set('position', posicion);
			
					//if(device_active==vehicle["de"] && vehicle["se"]==undefined || vehicle["se"]=="simulator" || vehicle["se"]=="historyForm") 
					if(device_active==vehicle["de"] && vehicle["se"]==undefined || vehicle["se"]=="simulator")
					{
					    // SI PASA EN EL HISTORICO
					    //alert("PASA 3");
					    centerMap(posicion);			
					    odometro(vehicle);
					} 
				}				
				var marcador 		    = markerMap(posicion, icon);		
				var infowindow 		    = messageMap(marcador, vehicle);
				
				fn_localizaciones(marcador, vehicle);
			}
			else
			{
				//alert(vehicle["ti"] + ">"+ localizacion_anterior[device_id]["ti"]);
			}					
		}
		else 
		{
			var marcador 		    =undefined;
			
			var tablero="<table><tr><td style=\"color:red;\"><b>Los vehiculos se encuentran bloqueados</b></td></tr><tr><td style=\"color:#fff;\">Favor de contactar con el administrador del sistema</td></tr></table>";	
    	    $("#tablero").html(tablero);			
		}
		return marcador;
	}
	*/
	/*
	function markerMap(position, icon, markerOptions) 
	{
        console.log("function markerMap");	
		if(markerOptions==undefined)	var markerOptions 			= new Object();
				
		markerOptions.position		=position;
		markerOptions.map			=map;
		//if(icon!=undefined)
		//	markerOptions.icon		=icon;
				
		console.log("function markerMap" + map);	
		var marker2=new google.maps.Marker(markerOptions);
 		return marker2
	}
	*/
	
	function messageMaps(marcador, vehicle, infowindow) 
	{
	    console.log("function messageMaps");
	    /*
		gMEvent.addListener(marcador, 'click', function() 
		{
		    device_active=vehicle["de"];
		    		    		    
		    $(".vehicle").removeClass("vehicle_active");
		    $(".vehicle[vehicle="+ vehicle["de"] +"]").addClass("vehicle_active");			
		                           
            if(gpsmap_section=="gpsmaps_maphistory")    infowindow.open(map,marcador);            
            else                                        status_device($("li.vehicle[vehicle="+ vehicle["de"] +"]"));		            	
		});							
		*/
	}
	function messageMap(marcador, vehicle) 
	{
	    console.log("function messageMap");
		var contentString = '<div id="contentIW"> \
								<table> \
									<tr> <th align=\"left\"> DISPOSITIVO</th><td>['+vehicle["license_plate"]+'] '+vehicle["dn"]+'	</td> 	</tr> \
									<tr> <th align=\"left\"> EVENTO</th><td>'+vehicle["ev"]+' '+vehicle["ty"]+'	</td> 	</tr> \
									<tr> <th align=\"left\"> FECHA	    </th><td>'+vehicle["ti"]+'	</td> 	</tr> \
									<tr> <th align=\"left\"> VELOCIDAD  </th><td>'+vehicle["sp"]+'</td> 	</tr> \
									<tr> <th align=\"left\"> CORDENADAS </th><td>('+vehicle["la"]+','+vehicle["lo"]+')</td> 	</tr> \
								</table> \
							</div>';

		var infowindow = map_info({content: contentString});		
		messageMaps(marcador, vehicle,infowindow);		
	}	
    
	function map_info(objeto)  
	{
	    console.log("function map_info");
		return new google.maps.InfoWindow(objeto);				
	}
	function fn_localizaciones(position, vehiculo)
    {
        console.log("function fn_localizaciones");
    	var ivehiculo=vehiculo["de"];
		if(localizaciones[ivehiculo]==undefined)     	
		{
			localizaciones[ivehiculo]	=Array(position);
			if(vehiculo["se"]!="simulator")    	vehicle_data[ivehiculo]		=Array(vehiculo)
		}	
		else
		{
			localizaciones[ivehiculo].unshift(position);			
			if(vehiculo["se"]!="simulator")     vehicle_data[ivehiculo].unshift(vehiculo)
		}	
    }    
    /*
    function centerMap(marcador)
	{
		map.panTo(marcador);		
	}
	*/
    function odometro(item)	 
    {    	
        console.log("function odometro");
        if(item["at"]==undefined)                       item["at"]=new Array();
        else if(item["at"]["totalDistance"]==undefined) item["at"]= JSON.parse(item["at"]);
        
    
    	if(item["at"]["battery"]==undefined)			item["ba"]  =0;
    	else								            item["ba"]  =item["at"]["battery"];
    	if(item["al"]==undefined)						item["al"]  =0;
    	else					            			item["al"]  =item["al"];
    	
		var gas;
        
    	if(item["at"]["totalDistance"]!=undefined)				
    	{
    	    var km = parseInt(parseInt(item["at"]["totalDistance"]) / 1000);
    	    	
    	    item["mi"]  					=km;    	    	
    	    if(item["odometer_unit"]=="miles")				
    	    {
    	        item["mi"]  				=km * 0.621371;    	    	
    	    }
    	}
    	
    	if(item["at"]["io3"]!=undefined)				
    	{
    		gas								=item["at"]["io3"];
    		//item["ga"]  					=parseInt(gas.substring(0,3));
    		item["ga"]  					=gas;    	    	
    	}	
    	else if(item["at"]["fuel"]!=undefined)
        {
    		gas								=item["at"]["fuel"];
    		//item["ga"]  					=parseInt(gas.substring(0,3));    	
    		item["ga"]  					=gas;    	    	
    	}
    	else if(item["at"]["fuel1"]!=undefined)
        {
    		gas								=item["at"]["fuel1"];
    		//item["ga"]  					=parseInt(gas.substring(0,3));
    		item["ga"]  					=gas;    	    	
    	}   
    	else								item["ga"]  =0;
    	
    	if(item["ba"]>100) item["ba"]=125;    
        var bat=item["ba"]*12/12.5-110;
        $("path.bateria").attr({"transform":"rotate("+ bat +" 250 250)"});            
        
        var vel=item["sp"]*12/10-110;  // 
        $("path.velocidad").attr({"transform":"rotate("+ vel +" 250 250)"});
        
        var alt=item["ga"]*12/10-38;
        $("path.altitude").attr({"transform":"rotate("+ alt +" 250 250)"});            

        $("#millas").html(item["mi"]);

        var tablero1="";
        var tablero2="";

		///*        
        if(item["st"]=="-1" && item["mo"]!="map")	//tiempo
        {
		    if(item["ni"]<=10)
	            tablero1= tablero1 + " :: EMPRESA PRE-BLOQUEADA :: ";
	        else
	        	alert("EMPRESA PRE-BLOQUEADA"); 
        }
        //*/
                        
        if(!(item["ti"]==undefined || item["ti"]==false || item["ti"]=="false"))	//tiempo
            tablero1= tablero1 + item["ti"];
        if(!(item["ge"]==undefined || item["ge"]==false || item["ge"]=="false"))        
            tablero1= tablero1 + " :: " + item["ge"];
  
        if(!(item["ev"]==undefined || item["ev"]==false || item["ev"]=="false"))	//evento
            tablero2= " :: " + item["ev"];
        
		
        if(!(item["ad"]==undefined || item["ad"]==false || item["ad"]=="false"))       
            tablero2= "UBICACION :: " + item["ad"] + tablero2;          
                       
        if(item["ni"]<=40)
        {
			var tablero="\
				<table>\
					<tr><td width=\"40\"  style=\"color:#fff;\"><a href=\"#\"onclick=\"command_device('Bloquear motor'," + item["de"] +")\"><img width=\"32\" src=\"../sitio_web/img/swich_off.png\"></a></td>\
					<td style=\"color:#fff;\"><a href=\"tel:" + item["te"] +"\">" + tablero1 + "</a></td></tr>\
					<tr><td width=\"40\"  style=\"color:#fff;\"><a href=\"#\"onclick=\"command_device('Activar motor'," + item["de"] +")\"><img width=\"32\" src=\"../sitio_web/img/swich_on.png\"></a></td>\
					<td style=\"color:#fff;\">" +tablero2 + "</td></tr>\
				</table>\
			";	
		}
		else
		{	
			var tablero="\
				<table id=\"data_tablero\">\
					<tr><td width=\"40\"  style=\"color:#fff;\"></td>\
					<td style=\"color:#fff;\">" + tablero1 + "</td></tr>\
					<tr><td width=\"40\"  style=\"color:#fff;\"></td>\
					<td style=\"color:#fff;\">" +tablero2 + "</td></tr>\
				</table>\
			";	
		}	

			var tablero="\
				<table id=\"data_tablero\">\
					<tr><td width=\"40\"  style=\"color:#fff;\"></td>\
					<td style=\"color:#fff;\"><a href=\"tel:" + item["phone"] +"\">" + tablero1 + "</a></td></tr>\
					<tr><td width=\"40\"  style=\"color:#fff;\"></td>\
					<td style=\"color:#fff;\">" +tablero2 + "</td></tr>\
				</table>\
			";	


        $("#tablero").html(tablero);
    }
	

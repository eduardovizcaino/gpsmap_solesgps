

# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import datetime, time
import requests, json
import random
import base64
from dateutil.relativedelta import relativedelta
from odoo import api, fields, models, _
import pytz
class fuel(models.Model):
    _inherit = "fleet.vehicle.log.fuel"
class services(models.Model):
    _inherit = "fleet.vehicle.log.services"
class cost(models.Model):
    _inherit = "fleet.vehicle.cost"
class contract(models.Model):
    _inherit = "fleet.vehicle.log.contract"
class odometer(models.Model):
    _inherit = "fleet.vehicle.odometer"
class vehicle_model(models.Model):
    _inherit = "fleet.vehicle.model"
class vehicle_model_brand(models.Model):
    _inherit = "fleet.vehicle.model.brand"

# CLONAR BD
# CREATE DATABASE traccar_developer WITH TEMPLATE traccar; 
# GRANT CONNECT ON DATABASE solesgps TO odoo;
# GRANT CONNECT ON DATABASE solesgps TO admin_evigra;


class tc_devices(models.Model):
    _name = "tc_devices"
    _description = 'traccar devices'
        
    name                                        = fields.Char('Name', size=128)
    uniqueid                                    = fields.Char('IMEI', size=128)
    phone                                       = fields.Char('Phone', size=128)
    lastupdate                                  = fields.Datetime('Lastupdate')
    disabled                                    = fields.Boolean('Disable', default=False)
    telcel                                      = fields.Boolean('Telcel', default=True)
    signal                                      = fields.Boolean('Good signal', default=True)
    
    
class tc_positions(models.Model):
    _name = "tc_positions"
    _description = 'traccar Positions'

    protocol                                    = fields.Char('Protocolo', size=15)
    #deviceid                                    = fields.Many2one('tc_devices',ondelete='set null', string="Vehiculo", index=True)
    deviceid                                    = fields.Integer('GPS')
    servertime                                  = fields.Datetime('Server Time')
    devicetime                                  = fields.Datetime('Device Time')
    fixtime                                     = fields.Datetime('Error Time')
    valid                                       = fields.Integer('Valido')
    latitude                                    = fields.Float('Latitud',digits=(5,10))
    longitude                                   = fields.Float('Longitud',digits=(5,10))
    altitude                                    = fields.Float('Altura',digits=(6,2))
    speed                                       = fields.Float('Velocidad',digits=(3,2))
    course                                      = fields.Float('Curso',digits=(3,2))
    address                                     = fields.Char('Calle', size=150)
    attributes                                  = fields.Char('Atributos', size=5000)
    accuracy                                    = fields.Float('Curso',digits=(3,2))
    network                                     = fields.Char('Type', size=4000)
    read                                        = fields.Integer('Leido',default=0)
    @api.multi
    def positions(self,datas):		   
        print("#### DOMAIN #######",datas["data"]["domain"])
        print("#### FIELDS #######",datas["fields"])
    	

        positions_data = self.search_read(datas["data"]["domain"], datas["fields"])
        for positions in positions_data:
            print("#### DATA #######",positions)

   


class vehicle(models.Model):
    _inherit = "fleet.vehicle"
    image_vehicle = fields.Selection([
        ('01', 'Gray Vehicle'),
        ('02', 'Red Vehicle'),
        ('03', 'Camioneta Gris'),
        ('04', 'Camioneta Gris'),
        ('05', 'White truck'),
        ('06', 'White van'),
        ('07', 'Blue van'),
        ('30', 'Moto'),
        ('90', 'Black Phone'),
        ('91', 'Blue  Phone'),
        ('92', 'Green Phone'),
        ('93', 'Red  Phone')
        ], 'Img GPS', default='01', help='Image of GPS Vehicle', required=True)
    temporal_id                                 = fields.Many2one('res.partner', 'temporal')
    #phone                                       = fields.Char('Phone', size=50)    
    economic_number                             = fields.Char('Economic Number', size=50)
    #imei                                        = fields.Char('Imei', size=50)
    speed                                       = fields.Char('Exceso de Velocidad', default=100, size=3)   
    #positionid                                  = fields.Many2one('gpsmap.positions',ondelete='set null', string="Position", index=True)    
    motor                                       = fields.Boolean('Motor', default=True, track_visibility="onchange")
    #devicetime                                  = fields.Datetime('Device Time')
    #devicetime_compu                            = fields.Datetime('Device Time', compute='_get_date')
    
    
    gps1_id                                     = fields.Many2one('tc_devices',ondelete='set null', string="GPS", index=True)
    
    
    @api.one
    def _get_date(self):      
        if(self.devicetime != False):          
            tz = pytz.timezone(self.env.user.tz) if self.env.user.tz else pytz.utc                            
            self.devicetime_compu=tz.localize(fields.Datetime.from_string(self.devicetime)).astimezone(pytz.utc)
        else:    
            self.devicetime_compu=self.devicetime
    
    @api.multi
    def positions(self,data):		   
        print("aaaaaaaaaaaa",data)
    	
    	
    	
    	
    	
    	
    	    	
        self.env.cr.execute("""
            SELECT tp.*, tp.deviceid as tp_deviceid, td.phone,
                CASE 		                
                    WHEN fv.odometer_unit='kilometers' THEN 1.852 * tp.speed
                    WHEN fv.odometer_unit='miles' THEN 1.15 * tp.speed
                    ELSE 1.852 * tp.speed                    
                END	AS speed_compu,
                CASE 				            
	                WHEN tp.attributes::json->>'alarm'!='' THEN tp.attributes::json->>'alarm'
	                WHEN tp.attributes::json->>'motion'='false' THEN 'Stopped'
	                WHEN tp.attributes::json->>'motion'='true' AND tp.speed>2 THEN 'Moving'
	                ELSE 'Stopped'
                END	as event,                                 
                CASE 				            
                    WHEN tp.attributes::json->>'alarm'!='' THEN 'alarm'
                    WHEN now() between tp.devicetime - INTERVAL '15' MINUTE AND tp.devicetime + INTERVAL '15' MINUTE THEN 'Online'
                    ELSE 'Offline'
                END  as status
            FROM  fleet_vehicle fv
                join tc_devices td on fv.gps1_id=td.id
                join tc_positions tp on td.positionid=tp.id
        """)
        
        return_positions                    ={}
        positions                           =self.env.cr.dictfetchall()
        for position in positions:
            position["de"]            =position["tp_deviceid"]                            
            tp_deviceid               =position["tp_deviceid"]
            
            return_positions[tp_deviceid]    =position

        return return_positions    
    def toggle_motor(self):
        try:
            sql="SELECT id FROM tc_devices td WHERE td.uniqueid='%s' " %(self.imei)    
            self.env.cr.execute(sql)
            devices_id                   =self.env.cr.dictfetchall()[0]["id"]
            
            if(self.motor==True):
                comando="engineStop"
            else:
                comando="engineResume"

            url = "http://odoo.solesgps.com:8082/api/commands/send"
            payload = {
                "id"            :0,
                "description"   :"Nuevo...",
                "deviceId"      :devices_id,
                "type"          :comando,
                "textChannel"   :"false",
                "attributes"    :{}
            }                        
            ##headers = {	"Authorization": "Basic " + encoded		}
            headers                 = {	"Authorization": "Basic YWRtaW46YWRtaW4=","content-type": "application/json"}        

            req                     = requests.post(url, data=json.dumps(payload), headers=headers)
            req.raise_for_status()        
            json_traccar            = req.json()
            
            if(self.motor==True):
                self.motor=False
            else:
                self.motor=True                        

        except Exception:
            print("#####################################################")                
            print("Error al conectar con traccar")                
    @api.model    
    def js_vehicles(self):
        hoy_fecha                               ="%s" %(datetime.datetime.now())
        hoy                                     =hoy_fecha[0:19]
    
        hoy_antes                               ="%s" %(datetime.datetime.now() - datetime.timedelta(minutes=5))        
        hoy_antes                               =hoy_antes[0:19]


        self.env.cr.execute("""
            SELECT tp.*, tp.deviceid as tp_deviceid, td.phone,
                CASE 		                
                    WHEN fv.odometer_unit='kilometers' THEN 1.852 * tp.speed
                    WHEN fv.odometer_unit='miles' THEN 1.15 * tp.speed
                    ELSE 1.852 * tp.speed                    
                END	AS speed_compu,
                CASE 				            
	                WHEN tp.attributes::json->>'alarm'!='' THEN tp.attributes::json->>'alarm'
	                WHEN tp.attributes::json->>'motion'='false' THEN 'Stopped'
	                WHEN tp.attributes::json->>'motion'='true' AND tp.speed>2 THEN 'Moving'
	                ELSE 'Stopped'
                END	as event,                                 
                CASE 				            
                    WHEN tp.attributes::json->>'alarm'!='' THEN 'alarm'
                    WHEN now() between tp.devicetime - INTERVAL '15' MINUTE AND tp.devicetime + INTERVAL '15' MINUTE THEN 'Online'
                    ELSE 'Offline'
                END  as status
            FROM  fleet_vehicle fv
                join tc_devices td on fv.gps1_id=td.id
                join tc_positions tp on td.positionid=tp.id
        """)
        return_positions                    ={}
        positions                           =self.env.cr.dictfetchall()
        for position in positions:
            position["de"]            =position["tp_deviceid"]                            
            tp_deviceid               =position["tp_deviceid"]
            
            return_positions[tp_deviceid]    =position
            
        return return_positions    
class speed(models.Model):
    _name = "gpsmap.speed"
    _description = 'Positions Speed'
    #_order = "starttime DESC"
    deviceid                                    = fields.Many2one('fleet.vehicle',ondelete='set null', string="Vehiculo", index=True)
    starttime                                   = fields.Datetime('Start Time')
    endtime                                     = fields.Datetime('End Time')
    speed                                       = fields.Float('Velocidad',digits=(3,2))
    
    
class route(models.Model):
    _name = "gpsmap.route"
    _description = 'GPS Route'
    name = fields.Char('Name', size=75)
    description = fields.Char('Description', size=150)
    area = fields.Text('area')
    attributes = fields.Text('Attributes')
    points = fields.Text('Points')
    hidden = fields.Boolean('Hidden')
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.user.company_id, required=True)
    company_ids = fields.Many2many('res.company', 'route_res_company_rel', 'user_id', 'cid', string='Companies', default=lambda self: self.env.user.company_id)


class geofence(models.Model):
    _name = "gpsmap.geofence"
    _description = 'GPS Geofence'
    name = fields.Char('Name', size=75)
    description = fields.Char('Description', size=150)
    area = fields.Text('area')
    attributes = fields.Text('Attributes')
    points = fields.Text('Points')
    color = fields.Selection([
        ('green', 'Green'),
        ('red', 'Red'),
        ('blue', 'Blue'),
        ('black', 'Black'),
        ('grey', 'Grey'),
        ('yellow', 'Yellow'),
        ], 'Color', default='green', help='Color of geofence', required=True)
    hidden = fields.Boolean('Hidden')
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.user.company_id, required=True)    
    company_ids = fields.Many2many('res.company', 'geofence_res_company_rel', 'user_id', 'cid', string='Companies', default=lambda self: self.env.user.company_id)
                 
    
    def geofences(self):
        alerts_obj      =self.env['gpsmap.geofence_device']

        alerts_args    =[]
        alerts_data    =alerts_obj.search(alerts_args, offset=0, limit=None, order=None)

        #if len(alerts_data)>0:                     
            #for alerts in alerts_data:
            #    print('ALERT ====================',alerts.name)        
        
        return alerts_data
                
        
        
class geofence_device(models.Model):
    _name = "gpsmap.geofence_device"
    _description = 'GPS Geofence Device'
    name = fields.Char('Name', size=75)
    description = fields.Char('Description', size=150)
    mail_in = fields.Char('Mail In', size=150)
    mail_out = fields.Char('Mail Out', size=150)    
    geofence_ids = fields.Many2many('gpsmap.geofence', 'alert_geofence', 'geofence_id', 'alert_id', string='Geofence')
    device_ids = fields.Many2many('fleet.vehicle', 'alert_device', 'device_id', 'alert_id', string='Device')            
    company_id = fields.Many2one('res.company', string='Company', default=lambda self: self.env.user.company_id, required=True)
    company_ids = fields.Many2many('res.company', 'geofence_device_res_company_rel', 'user_id', 'cid', string='Companies', default=lambda self: self.env.user.company_id)

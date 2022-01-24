# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name' : 'GPSMap SolesGPS',
    'price' : '395.0',
    'currency' : 'EUR',
    'author': "SolesGPS :: Eduardo Vizcaino",
    'category': 'fleet, GPS, Geolocation',
    'website' : 'https://solesgps.com',
    'summary' : 'Locate the satellite coordinates that your GPS devices throw. Save that information here and see it on the map.',
    'description' : """
Vehicle, leasing, insurances, cost
==================================
With this module, Odoo helps you managing all your vehicles, the
contracts associated to those vehicle as well as services, fuel log
entries, costs and many other features necessary to the management 
of your fleet of vehicle(s)
""",
    'depends': [
        'crm',
        'gpsmap',
        'purchase',
        'sale_management',
        'website',
        'website_crm'        
    ],
    'data': [
        'data/brand.xml',
        'data/company.xml',
        'data/tc_devices.xml',
        'data/vehicles.xml',

    ],
    'installable': True,
    'application': True,
}

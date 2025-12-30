import { DeliveryItem } from './DeliveryItem'

export interface DeliveryOrder{
	name: string
	creation: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/**	Customer : Link - Customer	*/
	customer: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	Partner Name : Data - Partner name from Odoo (fallback for customer_name)	*/
	partner_name?: string
	/**	Delivery Date : Date	*/
	delivery_date?: string
	/**	Sales Order : Link - Sales Order	*/
	sales_order?: string
	/**	Scheduled Date : Date	*/
	scheduled_date?: string
	/**	Odoo State : Select - State from Odoo (read-only, synced from Odoo)	*/
	odoo_state?: "draft" | "waiting" | "confirmed" | "assigned" | "loading" | "in_transit" | "arrived" | "delivering" | "done" | "partial_delivery" | "returned" | "cancel"
	/**	SFA State : Select - SFA workflow state (managed by SFA app)	*/
	sfa_state?: "waiting_transfer" | "pending" | "assigned" | "loading" | "in_transit" | "arrived" | "delivering" | "completed" | "partial" | "returned" | "cancelled"
	/**	Route : Link - Route	*/
	route?: string
	/**	Route Stop Index : Int - Index of the route stop this delivery is linked to	*/
	route_stop_idx?: number
	/**	Source Type : Select - Where is this delivery coming from?	*/
	source_type?: "direct" | "from_dc" | "from_wh"
	/**	Source Transfer : Link - Stock Transfer - Stock Transfer that brings goods to DC	*/
	source_transfer?: string
	/**	Source Warehouse : Link - Warehouse - The warehouse/DC where goods will be picked up	*/
	source_warehouse?: string
	/**	Current Driver : Link - User	*/
	current_driver?: string
	/**	Driver Name : Data	*/
	current_driver_name?: string
	/**	Current Assignment : Link - Delivery Assignment	*/
	current_assignment?: string
	/**	Assignment Count : Int - Total number of assignments (including handoffs)	*/
	assignment_count?: number
	/**	Tracking Enabled : Check	*/
	tracking_enabled?: 0 | 1
	/**	Tracking Started : Datetime	*/
	tracking_start_time?: string
	/**	Tracking Ended : Datetime	*/
	tracking_end_time?: string
	/**	Last Known Latitude : Float	*/
	last_known_latitude?: number
	/**	Last Known Longitude : Float	*/
	last_known_longitude?: number
	/**	Last GPS Update : Datetime	*/
	last_gps_update?: string
	/**	Customer Notified : Check	*/
	customer_notified?: 0 | 1
	/**	Notification Sent : Datetime	*/
	notification_timestamp?: string
	/**	Estimated Arrival : Datetime	*/
	estimated_delivery_time?: string
	/**	ETA Last Updated : Datetime	*/
	eta_last_updated?: string
	/**	POD Required : Check	*/
	pod_required?: 0 | 1
	/**	Photo Required : Check	*/
	pod_photo_required?: 0 | 1
	/**	Signature Required : Check - Check to require customer signature	*/
	pod_signature_required?: 0 | 1
	/**	POD Status : Select	*/
	pod_status?: "pending" | "completed" | "partial"
	/**	POD Reference : Link - Delivery POD	*/
	pod_reference?: string
	/**	Source Document : Data	*/
	origin?: string
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Delivery Type : Select	*/
	delivery_type?: "Outgoing" | "Incoming" | "Internal"
	/**	Picking Type : Data	*/
	picking_type?: string
	/**	Source Location : Data - Source location from Odoo	*/
	location_id?: string
	/**	Destination Location : Data - Destination location from Odoo	*/
	location_dest_id?: string
	/**	Items : Table - Delivery Item	*/
	items?: DeliveryItem[]
	/**	Odoo Picking ID : Int	*/
	odoo_id?: number
	/**	Odoo Delivery Number : Data - Original Odoo delivery number (e.g. WH/OUT/00023)	*/
	odoo_name?: string
	/**	Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Synced from Odoo"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Sync Error Message : Text	*/
	sync_error_message?: string
}
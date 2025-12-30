import { STDeliveryLink } from './STDeliveryLink'
import { StockTransferItem } from './StockTransferItem'

export interface StockTransfer{
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
	/**	Transfer Type : Select	*/
	transfer_type: "wh_to_dc" | "dc_to_dc" | "return_to_wh"
	/**	Scheduled Date : Date	*/
	scheduled_date: string
	/**	Odoo State : Select - State from Odoo (read-only, synced from Odoo)	*/
	odoo_state?: "draft" | "waiting" | "confirmed" | "assigned" | "done" | "cancel"
	/**	SFA State : Select - SFA workflow state (managed by SFA app)	*/
	sfa_state?: "pending" | "loading" | "in_transit" | "arrived" | "completed" | "returned" | "cancelled"
	/**	Route : Link - Route	*/
	route?: string
	/**	Route Stop Index : Int - Index of the route stop this transfer is linked to	*/
	route_stop_idx?: number
	/**	Source Warehouse : Link - Warehouse	*/
	source_warehouse: string
	/**	Source Location : Data - Odoo source location path	*/
	source_location?: string
	/**	Destination (DC) : Link - Warehouse	*/
	dest_warehouse: string
	/**	Dest Location : Data - Odoo destination location path	*/
	dest_location?: string
	/**	DC Contact : Data - Contact person at destination DC	*/
	dest_contact?: string
	/**	Assigned Driver : Link - User	*/
	assigned_driver?: string
	/**	Driver Name : Data	*/
	driver_name?: string
	/**	Vehicle : Data	*/
	vehicle?: string
	/**	Plate Number : Data	*/
	vehicle_plate?: string
	/**	Received By : Data - Name of DC staff who received the goods	*/
	received_by?: string
	/**	Received At : Datetime	*/
	received_at?: string
	/**	Handoff Photo : Attach Image	*/
	handoff_photo?: string
	/**	Notes : Small Text	*/
	handoff_notes?: string
	/**	Total Items : Int	*/
	total_items?: number
	/**	Total Deliveries : Int	*/
	total_deliveries?: number
	/**	Loading Completed : Datetime	*/
	loading_completed_at?: string
	/**	Transit Started : Datetime	*/
	transit_started_at?: string
	/**	Arrived At DC : Datetime	*/
	arrived_at?: string
	/**	Delivery Orders : Table - ST Delivery Link	*/
	delivery_orders?: STDeliveryLink[]
	/**	Items : Table - Stock Transfer Item	*/
	items?: StockTransferItem[]
	/**	Odoo Picking ID : Int	*/
	odoo_id?: number
	/**	Odoo Transfer Number : Data - Original Odoo transfer number	*/
	odoo_name?: string
	/**	Sync Status : Select	*/
	odoo_sync_status?: "Not Synced" | "Synced from Odoo"
	/**	Last Sync : Datetime	*/
	last_sync_timestamp?: string
	/**	Sync Error Message : Text	*/
	sync_error_message?: string
}
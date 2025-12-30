import { RouteStop } from './RouteStop'

export interface Route{
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
	/**	Series : Select	*/
	naming_series: "RT-.YYYY.-.#####"
	/**	Route Date : Date	*/
	route_date: string
	/**	Assigned User : Link - User	*/
	assigned_user: string
	/**	Assigned User Name : Data	*/
	assigned_user_name?: string
	/**	User Role : Select	*/
	user_role: "Sales Rep" | "Delivery Driver" | "Hub Driver"
	/**	Operating Unit : Link - Operating Unit	*/
	operating_unit?: string
	/**	Master Route : Link - Delivery Route - Reference to recurring route template	*/
	master_route?: string
	/**	Status : Select	*/
	status?: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
	/**	Start Time : Datetime	*/
	start_time?: string
	/**	End Time : Datetime	*/
	end_time?: string
	/**	Total Duration (Minutes) : Int	*/
	total_duration_minutes?: number
	/**	Total Stops : Int	*/
	total_stops?: number
	/**	Completed Stops : Int	*/
	completed_stops?: number
	/**	Skipped Stops : Int	*/
	skipped_stops?: number
	/**	Progress : Percent	*/
	progress_percentage?: number
	/**	Start Latitude : Float	*/
	start_latitude?: number
	/**	Start Longitude : Float	*/
	start_longitude?: number
	/**	End Latitude : Float	*/
	end_latitude?: number
	/**	End Longitude : Float	*/
	end_longitude?: number
	/**	Planned Distance (km) : Float	*/
	planned_distance_km?: number
	/**	Actual Distance (km) : Float	*/
	actual_distance_km?: number
	/**	Stops : Table - Route Stop	*/
	stops?: RouteStop[]
	/**	Notes : Small Text	*/
	notes?: string
}
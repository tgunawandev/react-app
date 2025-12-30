
export interface VisitSettings{
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
	/**	GPS Proximity Radius (meters) : Int - Maximum allowed distance from customer location for proximity validation	*/
	gps_proximity_radius_meters?: number
	/**	GPS Accuracy Threshold (meters) : Int - Maximum GPS accuracy allowed for check-in	*/
	gps_accuracy_threshold_meters?: number
	/**	Require Photo Evidence : Check - Require photo evidence for check-in	*/
	require_photo_evidence?: 0 | 1
	/**	Photo Timestamp Freshness (minutes) : Int - Maximum age of photo timestamp in minutes	*/
	photo_timestamp_freshness_minutes?: number
	/**	Photo Compression Quality (1-100) : Int	*/
	photo_quality?: number
	/**	Max Photo Size (MB) : Float	*/
	max_photo_size?: number
	/**	Enable QR Code Check-In : Check	*/
	enable_qr_check_in?: 0 | 1
	/**	Minimum Visit Duration (minutes) : Int	*/
	minimum_visit_duration?: number
	/**	Auto Check-Out After (hours) : Int	*/
	auto_checkout_hours?: number
	/**	Early Check-In Warning (hours) : Int	*/
	early_checkin_hours?: number
	/**	Late Check-In Warning (hours) : Int	*/
	late_checkin_hours?: number
}
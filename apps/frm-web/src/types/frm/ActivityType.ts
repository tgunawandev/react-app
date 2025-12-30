
export interface ActivityType{
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
	/**	Activity Name : Data	*/
	activity_name: string
	/**	Activity Code : Data	*/
	activity_code?: string
	/**	Enabled : Check	*/
	enabled?: 0 | 1
	/**	Applicable Roles : Small Text - Roles that can perform this activity (comma-separated)	*/
	applicable_roles?: string
	/**	Stop Types : Small Text - Stop types where this activity is available (comma-separated)	*/
	stop_types?: string
	/**	Is Mandatory : Check - Activity must be completed before stop can be marked complete	*/
	is_mandatory?: 0 | 1
	/**	Requires Proof : Check - Activity requires proof capture	*/
	requires_proof?: 0 | 1
	/**	Photo Required : Check	*/
	proof_photo_required?: 0 | 1
	/**	Signature Required : Check	*/
	proof_signature_required?: 0 | 1
	/**	GPS Required : Check	*/
	proof_gps_required?: 0 | 1
	/**	Receiver Name Required : Check	*/
	proof_receiver_required?: 0 | 1
	/**	Description : Small Text	*/
	description?: string
	/**	Icon : Data - Icon name for mobile UI (lucide icon name)	*/
	icon?: string
}
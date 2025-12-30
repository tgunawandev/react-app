
export interface DeliveryPOD{
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
	/**	Delivery Order : Link - Delivery Order	*/
	delivery_order: string
	/**	Delivery Assignment : Link - Delivery Assignment	*/
	delivery_assignment?: string
	/**	Customer : Link - Customer	*/
	customer?: string
	/**	Customer Name : Data	*/
	customer_name?: string
	/**	POD Status : Select	*/
	pod_status?: "pending" | "photo_captured" | "signature_captured" | "completed" | "rejected"
	/**	Delivery Outcome : Select	*/
	delivery_outcome?: "delivered" | "partial_delivery" | "rejected" | "customer_absent" | "wrong_address" | "other"
	/**	Captured By : Link - User	*/
	captured_by?: string
	/**	Captured At : Datetime	*/
	captured_at?: string
	/**	GPS Latitude : Float	*/
	gps_latitude?: number
	/**	GPS Longitude : Float	*/
	gps_longitude?: number
	/**	GPS Accuracy (m) : Float	*/
	gps_accuracy?: number
	/**	Address at Delivery : Small Text - Address at time of POD capture	*/
	address_captured?: string
	/**	Receiver Name : Data	*/
	receiver_name?: string
	/**	Receiver Phone : Data	*/
	receiver_phone?: string
	/**	Relationship : Select	*/
	receiver_relationship?: "" | "Customer" | "Employee" | "Family Member" | "Security" | "Receptionist" | "Other"
	/**	Delivery Photo : Attach Image - Main proof of delivery photo	*/
	delivery_photo?: string
	/**	Additional Photos : Attach - Additional photos (damaged goods, delivery location, etc.)	*/
	additional_photos?: string
	/**	Signature Required : Check	*/
	signature_required?: 0 | 1
	/**	Signature : Attach Image - Base64 encoded signature image	*/
	signature_image?: string
	/**	Signature Captured At : Datetime	*/
	signature_captured_at?: string
	/**	Delivery Notes : Small Text	*/
	delivery_notes?: string
	/**	Rejection Reason : Small Text	*/
	rejection_reason?: string
	/**	Partial Delivery Notes : Small Text	*/
	partial_delivery_notes?: string
}
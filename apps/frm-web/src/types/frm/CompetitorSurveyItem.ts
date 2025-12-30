
export interface CompetitorSurveyItem{
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
	/**	Competitor : Link - Competitor	*/
	competitor?: string
	/**	Other Competitor : Data - Enter competitor name if not in list	*/
	competitor_other?: string
	/**	Product Name : Data	*/
	product_name: string
	/**	Product Category : Data	*/
	product_category?: string
	/**	Price : Currency	*/
	price: number
	/**	Price Unit : Select	*/
	price_unit?: "/pcs" | "/btl" | "/pack" | "/box" | "/CTN" | "/kg" | "/ltr"
	/**	Stock Estimation : Int - Estimated stock quantity	*/
	stock_estimation?: number
	/**	Shelf Position : Select	*/
	shelf_position?: "" | "Eye Level" | "Top Shelf" | "Bottom Shelf" | "End Cap" | "Not Displayed"
	/**	Photo : Attach Image	*/
	photo?: string
	/**	Notes : Small Text	*/
	notes?: string
}
// FRM Module Types - Auto-generated, do not edit manually
// Re-run: bench --site sfa.local generate-types-for-module --app frm --module FRM --generate_child_tables

// Master Data
export type { ActivityType } from './ActivityType'
export type { Customer } from './Customer'
export type { Industry } from './Industry'
export type { Item } from './Item'
export type { OperatingUnit } from './OperatingUnit'
export type { PaymentTerm } from './PaymentTerm'
export type { Pricelist } from './Pricelist'
export type { PriceListItem } from './PriceListItem'
export type { ProductCategory } from './ProductCategory'
export type { SalesTeam } from './SalesTeam'
export type { SecondaryUoM } from './SecondaryUoM'
export type { Territory } from './Territory'
export type { UnitofMeasure } from './UnitofMeasure'
export type { Warehouse } from './Warehouse'

// Route-First Architecture
export type { Route } from './Route'
export type { RouteStop } from './RouteStop'
export type { RouteCustomer } from './RouteCustomer'
export type { RoutePlan } from './RoutePlan'
export type { RoutePlanItem } from './RoutePlanItem'

// Sales
export type { SalesOrder } from './SalesOrder'
export type { SalesOrderItem } from './SalesOrderItem'
export type { SalesVisit } from './SalesVisit'
export type { VisitActivity } from './VisitActivity'
export type { VisitActivityTemplate } from './VisitActivityTemplate'

// Delivery
export type { DeliveryAssignment } from './DeliveryAssignment'
export type { DeliveryGPSLog } from './DeliveryGPSLog'
export type { DeliveryItem } from './DeliveryItem'
export type { DeliveryItemCheck } from './DeliveryItemCheck'
export type { DeliveryOrder } from './DeliveryOrder'
export type { DeliveryPOD } from './DeliveryPOD'
export type { DeliveryReturn } from './DeliveryReturn'
export type { DeliveryReturnItem } from './DeliveryReturnItem'
export type { DeliveryRoute } from './DeliveryRoute'
export type { DeliveryTransitHub } from './DeliveryTransitHub'

// Stock
export type { StockQuant } from './StockQuant'
export type { StockTransfer } from './StockTransfer'
export type { StockTransferItem } from './StockTransferItem'
export type { STDeliveryLink } from './STDeliveryLink'

// Invoice & Payment
export type { Invoice } from './Invoice'
export type { InvoiceItem } from './InvoiceItem'
export type { PaymentEntry } from './PaymentEntry'
export type { PaymentInvoiceAllocation } from './PaymentInvoiceAllocation'

// Stock On-Hand
export type { StockOnHand } from './StockOnHand'

// Settings
export type { SFASettings } from './SFASettings'
export type { SFAUser } from './SFAUser'
export type { VisitSettings } from './VisitSettings'
export type { OdooSyncSettings } from './OdooSyncSettings'
export type { OdooSyncLog } from './OdooSyncLog'

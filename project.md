Property Valuation Data Collection & Management Platform

(Android + iOS App | Admin Panel | Google Sheets / Drive / Dropbox)


1. PROJECT PURPOSE

To build a secure, role-based property valuation data collection system where:

Admins fully own and control their organization’s data

Super Admin has NO visibility into valuation data

Mobile apps (Android & iOS) support offline-first field data collection

Valuation records can be exported in bank-specific predefined Excel formats

Full audit logging tracks every action and status update


2. KEY GOVERNANCE PRINCIPLE (MOST IMPORTANT)

Super Admin must NOT be able to view, access, or export any Admin’s collected valuation data.

Data ownership is Admin-based, not platform-based.


3. USER ROLES & PERMISSIONS

3.1 SUPER ADMIN (PLATFORM OWNER)

Permissions:

✔ Assign Admin accounts using Admin’s Gmail (or any Gmail)
✔ Reset passwords for Admins and Employees
✔ Enable / disable Admin accounts
✔ View system-level metadata only (no valuation data)

Restrictions:

❌ Cannot view valuation records
❌ Cannot access Google Sheets / Drive / Dropbox
❌ Cannot view property data, images, GPS, or exports

3.2 ADMIN (ORGANIZATION OWNER)

Permissions:

✔ Full ownership of organization’s data
✔ Connect their own Gmail for:

Google Sheets

Google Drive
✔ OR choose Dropbox instead of Google Drive
✔ Add / remove employees
✔ Reset employee passwords
✔ Configure bank valuation formats
✔ View, edit, verify, export valuation data


Admin-Owned Infrastructure:

Sheets
Drive / Dropbox
Exported files
Images


> Platform never stores Admin data centrally

3.3 EMPLOYEE (FIELD VALUATOR)

Permissions:

✔ Login to Android & iOS app
✔ Collect valuation data (online/offline)
✔ Update valuation status
✔ Upload images
✔ Capture GPS & map pins

Restrictions:

❌ Cannot export data
❌ Cannot edit verified valuations
❌ Cannot access admin panel

4. MOBILE APPLICATION (ANDROID + iOS)

4.1 Authentication

Email / phone-based login

Role-based access


4.2 Offline-First Data Collection (MANDATORY)

Features:

Full valuation form works offline

Images stored locally until sync

GPS coordinates cached

Sync queue with status:

Pending

Synced

Failed


4.3 Valuation Data Entry (NO IDs)

Instead of IDs, store live human-readable data:

Organization Details:

Organization Name

Address

Contact Number

Branch Name


Employee Details:

Employee Name

Contact Number

Role

Branch


Valuation Data:

As per the image provided

4.4 Date & Time Tracking (CRITICAL)

Each valuation must automatically store:

Created Date & Time

Last Updated Date & Time

Submission Date & Time

Sync Date & Time


4.5 Status Management (Shared Control)

Status fields editable by:

Employee

Admin


Examples:

Site Visit Started

Site Visit Completed

Data Submitted

Verified by Admin

Sent to Client

Closed


5. AUDIT LOGGING SYSTEM (MANDATORY)

Every change must log:

Field changed

Old value → New value

Updated by (Admin / Employee Name)

Date & Time

Device (optional)


Logs stored in:

Separate Google Sheet (Admin-owned)


6. ADMIN PANEL (WEB APPLICATION)

6.1 Admin Login

Email + password

Access limited to Admin’s connected Gmail storage


6.2 Organization & Employee Management

Admin can:

Add employees

Assign branch

Activate / deactivate employees

Reset employee access

View employee-wise valuation history


6.3 Valuation Dashboard

Total valuations

Pending sync

Pending verification

Status check

Input data from app

Map view (pins only visible to Admin)


6.4 Valuation Review Screen

Admin can:

View full valuation details

View images from Drive / Dropbox

View GPS location on map

Edit fields (before exporting)


6.5 Bank Valuation Form Builder (ADVANCED FEATURE)

Admin can:

Add Bank Name

Upload bank’s valuation format (Excel)

Define:

Required fields

Field mapping (App → Bank Format)

Mandatory vs Optional fields



Export Options:

Generate bank-specific Excel

One-click download

Auto-filled values

Correct column order


7. DATA STORAGE ARCHITECTURE

7.1 Google Sheets (Admin-Owned)

Used for:

Valuation data

Employees

Status logs

Audit logs

Bank form mapping


7.2 Google Drive / Dropbox (Admin-Owned)

Used for:

Image uploads

Exported Excel files

Archived valuations


Folder structure example:

/Organization Name/
  /Branch/
    /Valuation_Date/
      images/
      reports/


8. EXPORT & REPORTING

Admin can export:

Single valuation

Bulk valuations (date / employee / bank)


Formats: 
✔ Excel (.xlsx)
✔ CSV

Features:

Preformatted

Bank-compliant

Image links included

Timestamp included


9. SECURITY & PRIVACY

✔ Admin data fully isolated
✔ OAuth-based Google / Dropbox access
✔ No central data storage
✔ Audit logs immutable
✔ Role-based UI rendering


10. SUPPORTED PLATFORMS

Android App

iOS App

Web Admin Panel


11. NON-FUNCTIONAL REQUIREMENTS

Scalable for multi-org use

Offline reliability

Low-latency sync

Minimal training required




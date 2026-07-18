export type UserRole='Scholar'|'Mentor'|'ContentReviewer'|'Administrator'|'SuperAdministrator';
export type Permission='dashboard:view'|'study:write'|'team:view'|'mentor:view'|'content:review'|'admin:manage'|'certificate:download';
export interface CurrentUser{id:string;displayName:string;email:string;roles:UserRole[];permissions:Permission[];}

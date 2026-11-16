import { apiService } from '@/shared/services/apiService';
import type { QaBuild } from './projectQaApi';
const id=encodeURIComponent;
const pmPath=(project:string)=>`/tickets/projects/${id(project)}/uat`;
/** The project's hosted UAT frontends and their latest build, for the PM to test before sharing. */
export const pmProjectQaApi={
  targets:(project:string)=>apiService.ticketRequest<{items:Array<{repository:string}>}>(`${pmPath(project)}/targets`),
  preview:(project:string,repository:string)=>apiService.ticketRequest<{build:QaBuild}>(`${pmPath(project)}/preview?repository=${id(repository)}`),
};

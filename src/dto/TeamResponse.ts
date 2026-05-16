export interface TeamResponse {
  teamId: number;
  name: string;
  logo: string | null;
  adminName: string | null;
  isArchived: boolean;
}

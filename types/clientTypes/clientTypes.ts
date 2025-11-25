export interface ClientCreateDTO {
   accountName: string;
   contactName: string;
   email: string;
   phone: string;
   sendWelcome?: boolean;
   logo?: string;
}

export interface ClientUpdateDTO {
   email: string;
   accountName?: string;
   contactName?: string;
   phone?: string;
   sendWelcome?: boolean;
   logo?: string;
   welcomeEmail?: boolean;
}

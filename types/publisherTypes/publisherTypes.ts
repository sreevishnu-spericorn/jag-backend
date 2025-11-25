export interface PublisherCreateDTO {
   publisherName: string;
   email: string;
   phoneNo?: string;
   whatsappNo?: string;
   description?: string;
   products?: { productId: string; price: number }[];
}

export interface PublisherUpdateDTO {
   publisherName?: string;
   email?: string;
   phoneNo?: string;
   whatsappNo?: string;
   description?: string;
   products?: { productId: string; price: number }[];
}

export interface PublisherProductInput {
   productId: string;
   price: number;
}

export interface CreatePublisherDTO {
   publisherName: string;
   email: string;
   phoneNo?: string;
   whatsappNo?: string;
   description?: string;
   products: PublisherProductInput[];
}

export interface UpdatePublisherDTO {
   publisherName?: string;
   email?: string;
   phoneNo?: string;
   whatsappNo?: string;
   description?: string;
   products?: PublisherProductInput[];
   removedW9Files?: string[];
}

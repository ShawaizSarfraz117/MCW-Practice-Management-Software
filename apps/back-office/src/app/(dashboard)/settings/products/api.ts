// API functions for Products management

export interface Product {
  id: string;
  name: string;
  price: number;
  // Add other fields like is_active if they exist and are needed
}

/**
 * Fetches all products from the API
 */
export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

/**
 * Adds a new product
 */
export const addProduct = async (newProduct: {
  name: string;
  price: number;
}): Promise<Product> => {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newProduct),
  });
  if (!response.ok) {
    // Try to parse error details from the backend
    const errorData = await response.json().catch(() => ({})); // Catch if body isn't JSON
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }
  return response.json();
};

/**
 * Deletes a product by ID
 */
export const deleteProduct = async (
  productId: string,
): Promise<{ message: string }> => {
  const response = await fetch(`/api/products?id=${productId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }
  return response.json(); // Contains { message: "..." } on success
};

/**
 * Updates a single product
 */
export const updateSingleProduct = async (
  product: Product,
): Promise<Product> => {
  const { id, name, price } = product; // Destructure needed fields
  const response = await fetch(`/api/products?id=${id}`, {
    // Use query param for ID
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    // Send only name and price, or whichever fields are updatable
    body: JSON.stringify({ name, price }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }
  return response.json(); // API returns the updated product
};

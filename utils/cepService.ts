/**
 * Fetches address details (street, neighborhood, city, state) from ViaCEP API based on a zip code.
 * @param cep The 8-digit Brazilian zip code (CEP) string.
 * @returns A Promise that resolves with an object containing address details, or rejects with an error.
 */
export const fetchAddressByCep = async (cep: string) => {
  // Remove non-numeric characters
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido. Deve conter 8 dígitos.');
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado.');
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Erro ao consultar CEP:', error);
    throw new Error('Não foi possível consultar o CEP. Verifique o número ou sua conexão.');
  }
};
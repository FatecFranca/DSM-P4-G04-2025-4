export const maskCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Validação básica
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  
  return remainder === parseInt(cpf.substring(10, 11));
};

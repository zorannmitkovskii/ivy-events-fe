export function redirectToCpay(paymentUrl, fields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.acceptCharset = "UTF-8";

  Object.entries(fields || {}).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

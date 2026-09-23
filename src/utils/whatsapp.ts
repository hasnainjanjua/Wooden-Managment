import { Customer, CustomerLedgerEntry, Supplier, SupplierLedgerEntry, Karigar } from '../types';
import { formatPKR, formatDate } from './currency';

export function generateWhatsAppKhataLink(
  customer: Customer,
  entries: (CustomerLedgerEntry & { running_balance: number })[],
  shopName = 'Al Madinah CNC and Wood Works'
): string {
  let phone = (customer.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  } else if (!phone.startsWith('92') && phone.length === 10) {
    phone = '92' + phone;
  }

  const balance = customer.current_balance || 0;
  const todayStr = formatDate(new Date().toISOString());

  // Recent 3 transactions
  const recentEntries = entries.slice(-3);
  let recentText = '';
  if (recentEntries.length > 0) {
    recentText = '\n*Aakhri Len Den (Recent Transactions):*\n' + 
      recentEntries.map(e => {
        const type = e.debit > 0 ? `Banam: ${formatPKR(e.debit)}` : `Jama: ${formatPKR(e.credit)}`;
        return `• ${formatDate(e.entry_date)} - ${e.description.substring(0, 30)} (${type})`;
      }).join('\n');
  }

  const message = `*Assalam-o-Alaikum ${customer.name} Sahab,*

Yeh aapka khata hisab hai ba-janib *${shopName}*:
📅 Tareekh: ${todayStr}

💵 *Kul Baqaya Rakam (Current Balance): ${formatPKR(balance)}*
${recentText}

Baraye meherbani hisab check kar lein. Kisi bhi sawal ki soorat mein rabta karein.
JazakAllah Khair!`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function generateWhatsAppInvoiceLink(
  customer: Customer | null,
  invoice: { invoice_no: string; invoice_date: string; total_amount: number; discount_amount: number; cash_received: number; balance_amount: number },
  items: { item_name: string; quantity: number; rate: number; line_total: number }[],
  shopName = 'Al Madinah CNC and Wood Works'
): string {
  let phone = (customer?.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  } else if (!phone.startsWith('92') && phone.length === 10) {
    phone = '92' + phone;
  }

  const itemsList = items
    .map((itm, i) => `${i + 1}. *${itm.item_name}* - ${itm.quantity} x ${formatPKR(itm.rate)} = ${formatPKR(itm.line_total)}`)
    .join('\n');

  const netTotal = invoice.total_amount - (invoice.discount_amount || 0);

  const message = `*Assalam-o-Alaikum ${customer?.name || 'Customer'} Sahab,*

Aapka bill ba-janib *${shopName}*:
🧾 *Bill No:* ${invoice.invoice_no}
📅 *Tareekh:* ${formatDate(invoice.invoice_date)}

*Khareeda Gaya Saman (Items):*
${itemsList}
-----------------------------
💰 *Kul Raqam:* ${formatPKR(invoice.total_amount)}
${invoice.discount_amount > 0 ? `🏷️ *Discount:* -${formatPKR(invoice.discount_amount)}\n💵 *Net Bill:* ${formatPKR(netTotal)}\n` : ''}✅ *Naqad Ada Kiya:* ${formatPKR(invoice.cash_received)}
📌 *Baqaya (Udhaar): ${formatPKR(invoice.balance_amount)}*

Shukriya! JazakAllah Khair!`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function generateWhatsAppCncJobLink(
  customer: Customer | null,
  job: { job_no: string; job_date: string; job_description: string; size_specification?: string; total_amount: number; paid_amount: number; remaining_amount: number; status: string },
  shopName = 'Al Madinah CNC and Wood Works'
): string {
  let phone = (customer?.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  } else if (!phone.startsWith('92') && phone.length === 10) {
    phone = '92' + phone;
  }

  const message = `*Assalam-o-Alaikum ${customer?.name || 'Customer'} Sahab,*

Aapka CNC Kaam ba-janib *${shopName}*:
🎫 *Token No:* ${job.job_no}
📅 *Tareekh:* ${formatDate(job.job_date)}
⚙️ *Kaam:* ${job.job_description}
📐 *Size/Sheet:* ${job.size_specification || 'N/A'}
📊 *Status:* ${job.status}
-----------------------------
💰 *Kul Tay Shuda Raqam:* ${formatPKR(job.total_amount)}
✅ *Advance Ada Kiya:* ${formatPKR(job.paid_amount)}
📌 *Baqaya Rakam:* ${formatPKR(job.remaining_amount)}

Shukriya! JazakAllah Khair!`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function generateWhatsAppSupplierTransactionLink(
  supplier: Supplier | null,
  entry: SupplierLedgerEntry,
  shopName = 'Al Madinah CNC and Wood Works'
): string {
  let phone = (supplier?.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  } else if (!phone.startsWith('92') && phone.length === 10) {
    phone = '92' + phone;
  }

  const isPurchase = entry.ref_type === 'PURCHASE';
  const typeTitle = isPurchase ? '📦 Maal Khareedari (Purchase Bill)' : '💵 Ada Shuda Payment Voucher';

  let message = `*Assalam-o-Alaikum ${supplier?.name || 'Vendor'} Bhai,*\n\n`;
  message += `Yeh aapka len den record hai ba-janib *${shopName}*:\n`;
  message += `📄 *Record:* ${typeTitle}\n`;
  message += `📅 *Tareekh:* ${formatDate(entry.entry_date)}\n`;
  if (entry.bill_no) message += `🧾 *Bill No:* ${entry.bill_no}\n`;
  message += `📝 *Tafseel:* ${entry.description}\n`;
  message += `-----------------------------\n`;

  if (isPurchase) {
    message += `💰 *Khareedari Bill:* ${formatPKR(entry.credit)}\n`;
    if (entry.debit > 0) message += `✅ *Naqad Ada Kiya:* ${formatPKR(entry.debit)}\n`;
  } else {
    message += `✅ *Ada Shuda Raqam:* ${formatPKR(entry.debit)}\n`;
  }

  if (entry.running_balance !== undefined) {
    message += `📌 *Aapka Kul Baqaya Dena:* ${formatPKR(entry.running_balance)}\n`;
  }

  message += `\nShukriya! JazakAllah Khair!`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function generateWhatsAppKarigarWageLink(
  karigar: Karigar,
  summary: { totalEarned: number; totalPaid: number; netPayable: number; daysWorked: number },
  shopName = 'Al Madinah CNC and Wood Works'
): string {
  let phone = (karigar.phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '92' + phone.substring(1);
  } else if (!phone.startsWith('92') && phone.length === 10) {
    phone = '92' + phone;
  }

  const message = `*Assalam-o-Alaikum ${karigar.name} Mistri/Karigar,*

Aapka dihaari aur hazri hisab ba-janib *${shopName}*:
📅 *Tareekh:* ${formatDate(new Date().toISOString())}
🛠️ *Dihaari Rate:* ${formatPKR(karigar.daily_wage)} / din
📆 *Hazri Din:* ${summary.daysWorked} din
-----------------------------
💰 *Kul Kamai (Total Earned):* ${formatPKR(summary.totalEarned)}
✅ *Kul Wasool Kiya (Advance/Wages):* ${formatPKR(summary.totalPaid)}
📌 *Baqaya Rakam (Net Payable): ${formatPKR(summary.netPayable)}*

Shukriya! JazakAllah Khair!`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function sendWhatsAppMessage(phone: string, text: string) {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
    cleanPhone = '92' + cleanPhone;
  }

  // Check if mobile device and Web Share API is supported
  if (
    typeof navigator !== 'undefined' &&
    typeof (navigator as any).share === 'function' &&
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  ) {
    (navigator as any)
      .share({
        title: 'Al Madinah Wood Works Slip',
        text: text,
      })
      .catch(() => {
        const url = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
          : `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      });
    return;
  }

  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

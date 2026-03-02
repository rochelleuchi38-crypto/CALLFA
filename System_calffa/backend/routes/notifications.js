// routes/notifications.js
// Due-date notification system for loans and machinery bookings

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// ─── GET /api/notifications ─── Fetch notifications for the logged-in farmer
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query, params;

    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      // Admin roles see all notifications
      query = `
        SELECT n.*, f.full_name AS farmer_name, f.reference_number
        FROM due_date_notifications n
        JOIN farmers f ON n.farmer_id = f.id
        WHERE n.trigger_date <= CURDATE()
        ORDER BY n.is_read ASC, n.trigger_date DESC
        LIMIT 50
      `;
      params = [];
    } else {
      // Farmers only see their own notifications
      query = `
        SELECT n.*, f.full_name AS farmer_name, f.reference_number
        FROM due_date_notifications n
        JOIN farmers f ON n.farmer_id = f.id
        WHERE n.farmer_id = ? AND n.trigger_date <= CURDATE()
        ORDER BY n.is_read ASC, n.trigger_date DESC
        LIMIT 50
      `;
      params = [userId];
    }

    const [notifications] = await pool.execute(query, params);
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ─── GET /api/notifications/unread-count ─── Badge count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query, params;

    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      query = `SELECT COUNT(*) as count FROM due_date_notifications WHERE is_read = 0 AND trigger_date <= CURDATE()`;
      params = [];
    } else {
      query = `SELECT COUNT(*) as count FROM due_date_notifications WHERE farmer_id = ? AND is_read = 0 AND trigger_date <= CURDATE()`;
      params = [userId];
    }

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, count: rows[0].count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch count' });
  }
});

// ─── PUT /api/notifications/:id/read ─── Mark single notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(`UPDATE due_date_notifications SET is_read = 1 WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// ─── PUT /api/notifications/read-all ─── Mark all as read for current user
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (['admin', 'treasurer', 'president'].includes(userRole)) {
      await pool.execute(`UPDATE due_date_notifications SET is_read = 1 WHERE trigger_date <= CURDATE()`);
    } else {
      await pool.execute(`UPDATE due_date_notifications SET is_read = 1 WHERE farmer_id = ? AND trigger_date <= CURDATE()`, [userId]);
    }
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all read:', err);
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
});

// ─── POST /api/notifications/generate ─── Manually trigger notification generation (admin only)
router.post('/generate', verifyToken, async (req, res) => {
  try {
    if (!['admin', 'treasurer', 'president'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const count = await generateDueDateNotifications();
    res.json({ success: true, message: `Generated ${count} new notifications` });
  } catch (err) {
    console.error('Error generating notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to generate notifications' });
  }
});

// ─── Notification Generation Logic ───

async function generateDueDateNotifications() {
  let totalGenerated = 0;

  // Notification schedule: type → days before due date
  const schedule = [
    { type: 'last_month', label: 'Last Month Warning', getDaysBeforeFn: getFirstDayOfLastMonth },
    { type: 'last_week',  label: 'Last Week Warning',  days: 7 },
    { type: '3_days',     label: '3-Day Reminder',      days: 3 },
    { type: '2_days',     label: '2-Day Reminder',      days: 2 },
    { type: '1_day',      label: 'Tomorrow Due',        days: 1 },
    { type: 'due_day',    label: 'Due Today',           days: 0 },
  ];

  // ─── LOANS ───
  const [loans] = await pool.execute(`
    SELECT l.id, l.farmer_id, l.loan_amount, l.remaining_balance, l.due_date, 
           l.loan_type, l.status, f.full_name
    FROM loans l
    JOIN farmers f ON l.farmer_id = f.id
    WHERE l.status IN ('active', 'approved', 'overdue')
      AND l.remaining_balance > 0
      AND l.due_date IS NOT NULL
  `);

  for (const loan of loans) {
    for (const sched of schedule) {
      const triggerDate = getTriggerDate(loan.due_date, sched);
      if (!triggerDate) continue;

      const title = buildTitle('loan', sched.type, loan);
      const message = buildMessage('loan', sched.type, loan);

      const inserted = await upsertNotification({
        farmer_id: loan.farmer_id,
        reference_type: 'loan',
        reference_id: loan.id,
        notification_type: sched.type,
        title,
        message,
        due_date: loan.due_date,
        trigger_date: triggerDate
      });
      if (inserted) totalGenerated++;
    }
  }

  // ─── MACHINERY BOOKINGS ───
  const [bookings] = await pool.execute(`
    SELECT mb.id, mb.farmer_id, mb.total_price, mb.remaining_balance, 
           mb.booking_date, mb.payment_status, mb.status,
           mi.machinery_name, f.full_name
    FROM machinery_bookings mb
    JOIN farmers f ON mb.farmer_id = f.id
    LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
    WHERE mb.payment_status IN ('Unpaid', 'Partial')
      AND mb.remaining_balance > 0
      AND mb.status NOT IN ('Rejected', 'Cancelled')
  `);

  // For machinery bookings, use booking_date + 30 days as a pseudo due-date if there's no explicit due_date column
  for (const booking of bookings) {
    // Machinery bookings: due date is 30 days after booking
    const dueDate = new Date(booking.booking_date);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    for (const sched of schedule) {
      const triggerDate = getTriggerDate(dueDateStr, sched);
      if (!triggerDate) continue;

      const title = buildTitle('machinery_booking', sched.type, booking);
      const message = buildMessage('machinery_booking', sched.type, booking);

      const inserted = await upsertNotification({
        farmer_id: booking.farmer_id,
        reference_type: 'machinery_booking',
        reference_id: booking.id,
        notification_type: sched.type,
        title,
        message,
        due_date: dueDateStr,
        trigger_date: triggerDate
      });
      if (inserted) totalGenerated++;
    }
  }

  console.log(`📬 Generated ${totalGenerated} new due-date notifications`);
  return totalGenerated;
}

function getTriggerDate(dueDateStr, sched) {
  const dueDate = new Date(dueDateStr + 'T00:00:00');

  if (sched.type === 'last_month') {
    // First day of the month the due date falls in
    const triggerDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
    return triggerDate.toISOString().split('T')[0];
  }

  if (sched.type === 'last_week') {
    // 7 days before due date, but snap to Monday of that week
    const sevenBefore = new Date(dueDate);
    sevenBefore.setDate(sevenBefore.getDate() - 7);
    // Snap to Monday (day 1)
    const day = sevenBefore.getDay();
    const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6; otherwise go to Monday
    sevenBefore.setDate(sevenBefore.getDate() + diff);
    return sevenBefore.toISOString().split('T')[0];
  }

  // For days-based triggers
  const triggerDate = new Date(dueDate);
  triggerDate.setDate(triggerDate.getDate() - sched.days);
  return triggerDate.toISOString().split('T')[0];
}

function getFirstDayOfLastMonth(dueDateStr) {
  const dueDate = new Date(dueDateStr);
  return new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
}

function buildTitle(refType, notifType, record) {
  const typeLabel = refType === 'loan' ? 'Loan' : 'Machinery';
  const name = refType === 'loan'
    ? `${record.loan_type?.charAt(0).toUpperCase()}${record.loan_type?.slice(1)} Loan`
    : `${record.machinery_name || 'Machinery'} Booking`;

  switch (notifType) {
    case 'last_month': return `⚠️ Last Month - ${name} Payment Due`;
    case 'last_week':  return `🔔 Last Week - ${name} Payment Due`;
    case '3_days':     return `🚨 3 Days Left - ${name} Payment`;
    case '2_days':     return `🚨 2 Days Left - ${name} Payment`;
    case '1_day':      return `❗ Tomorrow - ${name} Payment Due`;
    case 'due_day':    return `🔴 DUE TODAY - ${name} Payment`;
    default:           return `${typeLabel} Payment Reminder`;
  }
}

function buildMessage(refType, notifType, record) {
  const balance = parseFloat(record.remaining_balance).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
  const dueDate = record.due_date
    ? new Date(record.due_date + 'T00:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  if (refType === 'loan') {
    const loanType = record.loan_type?.charAt(0).toUpperCase() + record.loan_type?.slice(1);
    switch (notifType) {
      case 'last_month':
        return `This is the last month to settle your ${loanType} Loan. Remaining balance: ${balance}. Due date: ${dueDate}. Please make your payment to avoid penalties.`;
      case 'last_week':
        return `Your ${loanType} Loan payment is due in less than a week! Remaining balance: ${balance}. Due: ${dueDate}. Please settle soon.`;
      case '3_days':
        return `Only 3 days left before your ${loanType} Loan payment of ${balance} is due on ${dueDate}. Please prepare your payment.`;
      case '2_days':
        return `Urgent: Your ${loanType} Loan payment of ${balance} is due in 2 days (${dueDate}). Please take action now.`;
      case '1_day':
        return `Your ${loanType} Loan payment of ${balance} is due TOMORROW (${dueDate}). Please settle your balance immediately.`;
      case 'due_day':
        return `Your ${loanType} Loan payment of ${balance} is due TODAY (${dueDate}). Please pay now to avoid being marked as overdue.`;
    }
  } else {
    const machineName = record.machinery_name || 'Machinery';
    switch (notifType) {
      case 'last_month':
        return `This is the last month to pay for your ${machineName} booking. Remaining balance: ${balance}. Please settle before the due date.`;
      case 'last_week':
        return `Your ${machineName} booking payment is due in less than a week! Remaining: ${balance}. Please settle soon.`;
      case '3_days':
        return `Only 3 days left to pay your ${machineName} booking balance of ${balance}. Please prepare your payment.`;
      case '2_days':
        return `Urgent: Your ${machineName} booking payment of ${balance} is due in 2 days. Please take action now.`;
      case '1_day':
        return `Your ${machineName} booking payment of ${balance} is due TOMORROW. Please settle immediately.`;
      case 'due_day':
        return `Your ${machineName} booking payment of ${balance} is due TODAY. Please pay now to avoid penalties.`;
    }
  }
  return 'Payment reminder for your balance.';
}

async function upsertNotification(data) {
  try {
    const [existing] = await pool.execute(
      `SELECT id FROM due_date_notifications 
       WHERE farmer_id = ? AND reference_type = ? AND reference_id = ? AND notification_type = ?`,
      [data.farmer_id, data.reference_type, data.reference_id, data.notification_type]
    );
    if (existing.length > 0) return false; // Already exists

    await pool.execute(
      `INSERT INTO due_date_notifications 
       (farmer_id, reference_type, reference_id, notification_type, title, message, due_date, trigger_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.farmer_id, data.reference_type, data.reference_id, data.notification_type,
       data.title, data.message, data.due_date, data.trigger_date]
    );
    return true;
  } catch (err) {
    // Ignore duplicate key errors (unique constraint)
    if (err.code === 'ER_DUP_ENTRY') return false;
    console.error('Error inserting notification:', err.message);
    return false;
  }
}

// Export for use by scheduler
module.exports = router;
module.exports.generateDueDateNotifications = generateDueDateNotifications;

-- ============================================================
-- SEED DATA for Hotel Reyxan
-- Run after migrations
-- ============================================================

-- Rooms
insert into public.rooms (number, floor, status) values
  ('101', 1, 'available'),
  ('102', 1, 'available'),
  ('108', 1, 'occupied'),
  ('204', 2, 'occupied'),
  ('215', 2, 'available'),
  ('305', 3, 'occupied'),
  ('312', 3, 'available'),
  ('401', 4, 'available')
on conflict (number) do nothing;

-- Services
insert into public.services (title, description, icon, action_type, action_value, is_active, sort_order) values
  ('Вызвать горничную', 'Уборка номера', 'ConciergeBell', 'request', null, true, 1),
  ('Связаться с администратором', 'Чат и поддержка', 'Headphones', 'chat', null, true, 2),
  ('Заказать еду в номер', 'Доставка из меню', 'Utensils', 'page', '/guest/menu', true, 3),
  ('Посмотреть меню', 'Меню ресторана', 'BookOpen', 'page', '/guest/menu', true, 4),
  ('Полотенца / уборка', 'Смена полотенец', 'Bath', 'request', null, true, 5),
  ('Техподдержка', 'Решение проблем', 'Headset', 'request', null, true, 6),
  ('Wi-Fi', 'Данные для подключения', 'Wifi', 'request', null, true, 7),
  ('Правила отеля', 'Информация об отеле', 'Shield', 'page', null, true, 8);

-- Menu categories
insert into public.menu_categories (name, sort_order, is_active) values
  ('Завтраки', 1, true),
  ('Горячие блюда', 2, true),
  ('Напитки', 3, true),
  ('Десерты', 4, true);

-- Menu items (using subqueries to get category ids)
insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Омлет с зеленью',
  'Воздушный омлет из трёх яиц с зеленью и томатами черри. Подаётся с тостами.',
  650, true
from public.menu_categories where name = 'Завтраки';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Овсяная каша',
  'Овсяная каша на молоке с сезонными ягодами и мёдом.',
  450, true
from public.menu_categories where name = 'Завтраки';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Сырники с ванилью',
  'Нежные сырники из творога с ванилью, подаётся со сметаной и ягодным соусом.',
  550, true
from public.menu_categories where name = 'Завтраки';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Фруктовая тарелка',
  'Ассорти из свежих сезонных фруктов и ягод.',
  750, true
from public.menu_categories where name = 'Завтраки';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Куриный суп',
  'Наваристый куриный бульон с домашней лапшой и свежей зеленью.',
  700, true
from public.menu_categories where name = 'Горячие блюда';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Стейк с овощами',
  'Сочный стейк из мраморной говядины с гриль-овощами и соусом дэми-гляс.',
  1600, true
from public.menu_categories where name = 'Горячие блюда';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Чай зелёный',
  'Премиальный зелёный чай. Чайник 600 мл.',
  300, true
from public.menu_categories where name = 'Напитки';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Кофе американо',
  'Двойной эспрессо с горячей водой. 300 мл.',
  350, true
from public.menu_categories where name = 'Напитки';

insert into public.menu_items (category_id, name, description, price, is_available)
select id, 'Медовик',
  'Классический медовый торт с нежным кремом из сметаны.',
  500, true
from public.menu_categories where name = 'Десерты';

-- Hotel settings
insert into public.hotel_settings (
  hotel_name, reception_phone, admin_email,
  wifi_name, wifi_password, food_delivery_hours
) values (
  'Отель Рейхан',
  '+7 (800) 123-45-67',
  'admin@reyhan.ru',
  'Reyxan_Hotel',
  'reyxan2024',
  '07:00–23:00'
) on conflict do nothing;

-- NOTE: To create an admin user, use Supabase Auth dashboard to create a user,
-- then run:
-- insert into public.profiles (id, email, full_name, role)
-- values ('<user-uuid>', 'admin@reyhan.ru', 'Администратор', 'admin');

UPDATE public.devices
SET client_id = 'dc7ba746-f564-45a9-9a02-c95ab18b99fd',
    phone_number = '+254750444167'
WHERE id = '1630ca86-55df-4f0c-a68b-0553d851caeb';

INSERT INTO public.messages (client_id, recipient, message, status, priority)
VALUES ('dc7ba746-f564-45a9-9a02-c95ab18b99fd', '+254705693688',
        'Test from 0750444167 via B TEXTMAN gateway', 'queued', 9);
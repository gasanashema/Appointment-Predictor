import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from db.mongo import get_collection

class Command(BaseCommand):
    help = 'Seeds the database with dummy appointments'

    def handle(self, *args, **kwargs):
        collection = get_collection("appointments")
        # Optional: Clear existing for clean slate
        # collection.delete_many({})

        neighbourhoods = ['JARDIM DA PENHA', 'MATA DA PRAIA', 'PONTAL DE CAMBURI', 'JARDIM CAMBURI', 'MARIA ORTIZ']
        
        appointments = []
        now = datetime.now()

        for i in range(20):
            # Randomize logic
            gender = random.choice(['M', 'F'])
            age = random.randint(18, 90)
            
            # Future appointment
            days_ahead = random.randint(1, 30)
            appt_day = now + timedelta(days=days_ahead)
            sched_day = now - timedelta(days=random.randint(0, 10))
            
            appt = {
                "patient_name": f"Patient {i+1}",
                "Gender": gender,
                "Age": age,
                "Neighbourhood": random.choice(neighbourhoods),
                "Scholarship": 0, # Legacy field, kept 0
                "Hipertension": random.choice([0, 1]) if age > 50 else 0,
                "Diabetes": random.choice([0, 1]) if age > 60 else 0,
                "Alcoholism": 0,
                "Handcap": 0,
                "SMS_received": random.choice([0, 1]),
                "ScheduledDay": sched_day.isoformat(),
                "AppointmentDay": appt_day.isoformat(),
                "status": "Scheduled"
            }
            appointments.append(appt)

        if appointments:
            collection.insert_many(appointments)
            self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(appointments)} appointments'))

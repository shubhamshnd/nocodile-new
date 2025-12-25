"""
Script to create child forms for Guest Requisition
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nocodile.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import Form, FormComponent, ChildForm, DocumentType

# Get the Guest Requisition document type
doc_type = DocumentType.objects.get(name='Guest Requisition')
app = doc_type.application

print(f'Creating child forms for: {doc_type.name} (App: {app.name})')

# Define child form configurations
child_configs = [
    {
        'name': 'Hotel Stay',
        'description': 'Hotel stay arrangement for guests',
        'fields': [
            {'type': 'text', 'key': 'hotel_name', 'label': 'Hotel Name', 'required': True},
            {'type': 'text', 'key': 'hotel_address', 'label': 'Hotel Address'},
            {'type': 'datetime', 'key': 'check_in_date', 'label': 'Check-in Date', 'required': True},
            {'type': 'datetime', 'key': 'check_out_date', 'label': 'Check-out Date', 'required': True},
            {'type': 'number', 'key': 'number_of_rooms', 'label': 'Number of Rooms', 'default': 1},
            {'type': 'radio', 'key': 'room_type', 'label': 'Room Type', 'options': ['Single', 'Double', 'Suite', 'Deluxe']},
            {'type': 'textarea', 'key': 'special_requests', 'label': 'Special Requests'},
        ]
    },
    {
        'name': 'Guest House Stay',
        'description': 'Guest house accommodation arrangement',
        'fields': [
            {'type': 'text', 'key': 'guest_house_name', 'label': 'Guest House Name', 'required': True},
            {'type': 'datetime', 'key': 'arrival_date', 'label': 'Arrival Date', 'required': True},
            {'type': 'datetime', 'key': 'departure_date', 'label': 'Departure Date', 'required': True},
            {'type': 'number', 'key': 'number_of_guests', 'label': 'Number of Guests', 'default': 1},
            {'type': 'radio', 'key': 'room_preference', 'label': 'Room Preference', 'options': ['AC', 'Non-AC']},
            {'type': 'radio', 'key': 'meal_included', 'label': 'Meals Included', 'options': ['Yes', 'No']},
            {'type': 'textarea', 'key': 'remarks', 'label': 'Remarks'},
        ]
    },
    {
        'name': 'Vehicle Arrangement',
        'description': 'Vehicle and transport arrangements',
        'fields': [
            {'type': 'radio', 'key': 'vehicle_type', 'label': 'Vehicle Type', 'options': ['Car', 'SUV', 'Van', 'Bus'], 'required': True},
            {'type': 'datetime', 'key': 'pickup_datetime', 'label': 'Pickup Date & Time', 'required': True},
            {'type': 'text', 'key': 'pickup_location', 'label': 'Pickup Location', 'required': True},
            {'type': 'text', 'key': 'drop_location', 'label': 'Drop Location', 'required': True},
            {'type': 'number', 'key': 'number_of_passengers', 'label': 'Number of Passengers', 'default': 1},
            {'type': 'radio', 'key': 'trip_type', 'label': 'Trip Type', 'options': ['One Way', 'Round Trip', 'Full Day']},
            {'type': 'textarea', 'key': 'special_instructions', 'label': 'Special Instructions'},
        ]
    },
    {
        'name': 'Food Arrangement',
        'description': 'Food and catering arrangements for guests',
        'fields': [
            {'type': 'radio', 'key': 'meal_type', 'label': 'Meal Type', 'options': ['Breakfast', 'Lunch', 'Dinner', 'High Tea', 'Snacks'], 'required': True},
            {'type': 'datetime', 'key': 'meal_datetime', 'label': 'Date & Time', 'required': True},
            {'type': 'text', 'key': 'venue', 'label': 'Venue'},
            {'type': 'number', 'key': 'number_of_people', 'label': 'Number of People', 'required': True},
            {'type': 'radio', 'key': 'cuisine_type', 'label': 'Cuisine Type', 'options': ['Vegetarian', 'Non-Vegetarian', 'Mixed']},
            {'type': 'radio', 'key': 'food_preference', 'label': 'Food Preference', 'options': ['Indian', 'Chinese', 'Continental', 'Mix']},
            {'type': 'textarea', 'key': 'dietary_restrictions', 'label': 'Dietary Restrictions'},
            {'type': 'textarea', 'key': 'special_requests', 'label': 'Special Requests'},
        ]
    },
]

created_count = 0
for config in child_configs:
    # Check if child document type already exists
    existing = DocumentType.objects.filter(name=config['name'], application=app).first()
    if existing:
        print(f"Skipping '{config['name']}' - already exists")
        continue

    # Create child document type
    slug = config['name'].lower().replace(' ', '_')
    child_doc_type = DocumentType.objects.create(
        application=app,
        name=config['name'],
        slug=slug,
        settings={'description': config['description']},
    )
    print(f"Created DocumentType: {child_doc_type.name}")

    # Create form for child document type
    form = Form.objects.create(
        document_type=child_doc_type,
        name=config['name'],
        is_active=True,
    )
    print(f"  Created Form: {form.name}")

    # Create form components
    for i, field in enumerate(config['fields']):
        component_config = {
            'label': field['label'],
            'placeholder': f"Enter {field['label'].lower()}",
        }

        if field.get('required'):
            component_config['required'] = True
        if field.get('default') is not None:
            component_config['defaultValue'] = field['default']
        if field.get('options'):
            component_config['options'] = [{'label': o, 'value': o.lower().replace(' ', '_')} for o in field['options']]

        component = FormComponent.objects.create(
            form=form,
            component_type=field['type'],
            field_key=field['key'],
            config=component_config,
            order=i * 100,
        )
    print(f"  Created {len(config['fields'])} components")

    # Create ChildForm link
    child_form = ChildForm.objects.create(
        parent_document_type=doc_type,
        child_document_type=child_doc_type,
        relation_type='one_to_many',
        visibility={'states': ['*']},  # Visible in all states
    )
    print(f"  Linked to parent: {doc_type.name}")

    created_count += 1

print(f"\n=== Created {created_count} child forms ===")

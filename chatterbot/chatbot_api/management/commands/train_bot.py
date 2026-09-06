from django.core.management.base import BaseCommand
from chatterbot import ChatBot
from chatterbot.trainers import ListTrainer, ChatterBotCorpusTrainer
from django.conf import settings

class Command(BaseCommand):
    help = 'Trains the ChatBot with default corpus and custom lists'

    def handle(self, *args, **kwargs):
        self.stdout.write('Initializing ChatBot...')
        bot = ChatBot(**settings.CHATTERBOT)

        self.stdout.write('Training with custom lists...')
        list_trainer = ListTrainer(bot)
        list_to_train = [
            "hi",
            "hi, there",
            "what's your name?",
            "I'm EduSync AI, your virtual assistant.",
            'How can I retake a course?',
            'You can retake a course by re-registering during the next semester. Please contact the administration for approval.',
        ]
        list_trainer.train(list_to_train)

        self.stdout.write('Training with English corpus...')
        corpus_trainer = ChatterBotCorpusTrainer(bot)
        corpus_trainer.train('chatterbot.corpus.english')

        self.stdout.write(self.style.SUCCESS('Successfully trained the ChatBot!'))


import google.generativeai as genai
import random
import os
import json
import gradio as gr
import random

# Configure the Gemini API
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in Colab secrets.")
    genai.configure(api_key=GOOGLE_API_KEY)
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    print("Please make sure you have added your GOOGLE_API_KEY to Colab secrets.")

# Initialize the Generative Model
try:
    gemini_model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
except Exception as e:
    print(f"Error initializing Gemini model: {e}")
    gemini_model = None


try:
    gemini_model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
except Exception as e:
    print(f"Error initializing Gemini model: {e}")
    gemini_model = None


def generate_vocabulary(level="B1-C1", num_words=10):
    if not gemini_model:
        print("Gemini model not initialized. Cannot generate vocabulary.")
        return []

    prompt = (
        f"Generate a list of {num_words} English vocabulary words with KK Phonetic Symbol, with their English definition, and with one example sentence each, "
        f"suitable for {level} level. Format the output as a pure JSON array of objects. "
        f"Please include at least 3 words in level B2 or C1"
        f"Each object should have 'word' , 'pronunciation', 'definition', and 'sentence' keys. "
        f"Please consider at least 1 words from Lenny's Podcast's transcript and sentences, so it's more tech related."
        f"Do not include any extra text, explanation, or code block. Only output the JSON array."
    )

    try:
        response = gemini_model.generate_content(prompt)

        # Inspect the raw structure — this is the best practice for Gemini SDK
        print("=== Raw response ===")
        print(response)

        # Extract the text properly
        if hasattr(response, "text") and response.text:
            text = response.text
        elif hasattr(response, "candidates"):
            text = response.candidates[0].content.parts[0].text
        else:
            raise ValueError("Unexpected response format from Gemini API.")

        # Debug: print raw text
        print("=== Raw text ===")
        print(text)

        # If text is wrapped in code block, strip it
        if text.strip().startswith("```"):
            text = text.strip().strip("`")
            # Remove optional language tag (e.g., ```json)
            lines = text.split("\n")
            if lines[0].strip().startswith("json"):
                lines = lines[1:]
            text = "\n".join(lines).rsplit("```", 1)[0].strip()

        # Load JSON
        vocabulary_data = json.loads(text)
        return vocabulary_data

    except Exception as e:
        print(f"Error generating vocabulary: {e}")
        return []


# Generate vocabulary data
vocabulary_list = generate_vocabulary()

# Display the generated vocabulary
print("=== Final Vocabulary List ===")
print(vocabulary_list)



def generate_and_select_vocabulary():
    print("Attempting to generate vocabulary...")
    vocabulary_list = generate_vocabulary() # This function is assumed to be defined and working from a previous step
    print(f"Generated vocabulary list (or error message): {vocabulary_list}")

    if not vocabulary_list:
        print("Vocabulary list is empty or generation failed.")
        return "Error: Could not generate vocabulary. Please check API configuration and try again."

    # Randomly select up to 5 items from the generated list
    # Ensure we don't try to select more items than are available
    num_to_select = min(5, len(vocabulary_list))
    print(f"Selecting {num_to_select} words from the list.")
    try:
        selected_vocabulary = random.sample(vocabulary_list, num_to_select)
        print(f"Selected vocabulary: {selected_vocabulary}")
    except ValueError as e:
        print(f"Error selecting random vocabulary: {e}")
        return f"Error selecting vocabulary: {e}"


    # Format the selected vocabulary
    formatted_output = ""
    if selected_vocabulary:
      for item in selected_vocabulary:
          # Added checks for 'word' and 'sentence' keys
          word = item.get('word', 'N/A')
          sentence = item.get('sentence', 'N/A')
          pronunciation = item.get('pronunciation', 'N/A')
          definition = item.get('definition', 'N/A')
          formatted_output += f"**Word**: {word}<br>"
          formatted_output += f"**Pronunciation**: {pronunciation}<br>"
          formatted_output += f"**Definition**: {definition}<br>"
          formatted_output += f"**Sentence**: {sentence}<br><br>"
          print(f"Formatted output for {word}: {formatted_output}")
    else:
        formatted_output = "No vocabulary selected."

    print("Formatted output generated.")
    return formatted_output

# ✅ Gradio Interface
interface = gr.Interface(
    fn=generate_and_select_vocabulary,
    inputs=[],
    outputs=gr.HTML(),
    title="Vocabulary Generator",
    description="Click the button to generate 5 random advanced vocabulary words with definitions and example sentences."
)

# ✅ Must be at the end!
interface.launch()


